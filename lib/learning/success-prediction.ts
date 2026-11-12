import modelBundle from "@/ml/models/success_model.json";

export type PredictionFeatures = {
  previous_accuracy: number;
  attempts_per_problem: number;
  topic_familiarity: number;
  problem_difficulty: number;
  recent_success_rate: number;
  related_topic_performance: number;
  learning_activity_hours: number;
};

type ExportedTree = {
  left: number[];
  right: number[];
  feature: number[];
  threshold: number[];
  positive_probability: number[];
};

type ExportedModel = {
  version: number;
  kind: "forest" | "logistic";
  features: string[];
  mean: number[];
  scale: number[];
  estimators?: ExportedTree[];
  coefficients?: number[];
  intercept?: number;
};

const expectedFeatures: (keyof PredictionFeatures)[] = [
  "previous_accuracy",
  "attempts_per_problem",
  "topic_familiarity",
  "problem_difficulty",
  "recent_success_rate",
  "related_topic_performance",
  "learning_activity_hours",
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isFiniteNumber(item))
  );
}

function validateTree(tree: unknown, treeIndex: number): asserts tree is ExportedTree {
  if (!tree || typeof tree !== "object") {
    throw new Error(`The generated success model has an invalid tree at index ${treeIndex}.`);
  }

  const candidate = tree as Record<string, unknown>;
  const arrays = ["left", "right", "feature", "threshold", "positive_probability"]
    .map((key) => candidate[key]);
  if (!arrays.every((value) => Array.isArray(value))) {
    throw new Error(`The generated success model has incomplete tree arrays at index ${treeIndex}.`);
  }

  const [left, right, feature, threshold, positiveProbability] = arrays as [
    unknown[],
    unknown[],
    unknown[],
    unknown[],
    unknown[],
  ];
  const nodeCount = left.length;
  if (
    nodeCount === 0 ||
    right.length !== nodeCount ||
    feature.length !== nodeCount ||
    threshold.length !== nodeCount ||
    positiveProbability.length !== nodeCount
  ) {
    throw new Error(`The generated success model has inconsistent tree lengths at index ${treeIndex}.`);
  }

  for (let node = 0; node < nodeCount; node += 1) {
    if (
      !Number.isInteger(left[node]) ||
      !Number.isInteger(right[node]) ||
      !Number.isInteger(feature[node]) ||
      !isFiniteNumber(threshold[node]) ||
      !isFiniteNumber(positiveProbability[node]) ||
      (positiveProbability[node] as number) < 0 ||
      (positiveProbability[node] as number) > 1
    ) {
      throw new Error(`The generated success model has invalid tree values at index ${treeIndex}.`);
    }

    const featureIndex = feature[node] as number;
    const leftIndex = left[node] as number;
    const rightIndex = right[node] as number;
    if (featureIndex === -2) {
      if (leftIndex !== -1 || rightIndex !== -1) {
        throw new Error(`The generated success model has invalid leaf indexes at tree ${treeIndex}.`);
      }
      continue;
    }
    if (
      featureIndex < 0 ||
      featureIndex >= expectedFeatures.length ||
      leftIndex < 0 ||
      leftIndex >= nodeCount ||
      rightIndex < 0 ||
      rightIndex >= nodeCount
    ) {
      throw new Error(`The generated success model has invalid child indexes at tree ${treeIndex}.`);
    }
  }

  const states = new Array<number>(nodeCount).fill(0);
  const stack: Array<[number, boolean]> = [[0, false]];
  while (stack.length > 0) {
    const [node, exiting] = stack.pop()!;
    if (exiting) {
      states[node] = 2;
      continue;
    }
    if (states[node] === 1) {
      throw new Error(`The generated success model contains a cycle in tree ${treeIndex}.`);
    }
    if (states[node] === 2) continue;
    states[node] = 1;
    stack.push([node, true]);
    if ((feature[node] as number) !== -2) {
      stack.push([right[node] as number, false], [left[node] as number, false]);
    }
  }
  if (states.some((state) => state !== 2)) {
    throw new Error(`The generated success model has unreachable nodes in tree ${treeIndex}.`);
  }
}

function validateModel(bundle: unknown): asserts bundle is ExportedModel {
  if (!bundle || typeof bundle !== "object") {
    throw new Error("The generated success model artifact is malformed.");
  }
  const candidate = bundle as Record<string, unknown>;
  if (candidate.version !== 1) {
    throw new Error("The generated success model has an unsupported version.");
  }
  if (
    !Array.isArray(candidate.features) ||
    candidate.features.length !== expectedFeatures.length ||
    candidate.features.some(
      (feature, index) => feature !== expectedFeatures[index]
    )
  ) {
    throw new Error("The generated success model has an incompatible feature schema.");
  }
  if (
    !isFiniteNumberArray(candidate.mean) ||
    candidate.mean.length !== expectedFeatures.length ||
    !isFiniteNumberArray(candidate.scale) ||
    candidate.scale.length !== expectedFeatures.length ||
    candidate.scale.some((scale) => scale === 0)
  ) {
    throw new Error("The generated success model has invalid scaler parameters.");
  }

  if (candidate.kind === "forest") {
    if (!Array.isArray(candidate.estimators) || candidate.estimators.length === 0) {
      throw new Error("The generated tree model is incomplete.");
    }
    candidate.estimators.forEach((tree, index) => validateTree(tree, index));
    return;
  }

  if (candidate.kind === "logistic") {
    if (
      !isFiniteNumberArray(candidate.coefficients) ||
      candidate.coefficients.length !== expectedFeatures.length ||
      !isFiniteNumber(candidate.intercept)
    ) {
      throw new Error("The generated logistic model is incomplete.");
    }
    return;
  }
  throw new Error("The generated success model has an unsupported model kind.");
}

const model = modelBundle as ExportedModel;
validateModel(model);

function validatePredictionFeatures(features: PredictionFeatures): void {
  for (const feature of expectedFeatures) {
    if (!isFiniteNumber(features[feature])) {
      throw new Error(`Invalid prediction feature: ${feature} must be a finite number.`);
    }
  }
}

function scaleFeatures(features: PredictionFeatures): number[] {
  return expectedFeatures.map(
    (feature, index) => (features[feature] - model.mean[index]) / model.scale[index]
  );
}

function predictTree(tree: ExportedTree, features: number[]): number {
  let node = 0;
  while (tree.feature[node] >= 0) {
    const featureIndex = tree.feature[node];
    node =
      features[featureIndex] <= tree.threshold[node]
        ? tree.left[node]
        : tree.right[node];
  }
  return tree.positive_probability[node];
}

export function predictProblemSuccess(features: PredictionFeatures): number {
  validatePredictionFeatures(features);
  const scaled = scaleFeatures(features);
  if (model.kind === "logistic") {
    const coefficients = model.coefficients;
    if (!coefficients || model.intercept === undefined) {
      throw new Error("The generated logistic model is incomplete.");
    }
    const logOdds =
      model.intercept +
      coefficients.reduce((sum, coefficient, index) => sum + coefficient * scaled[index], 0);
    return 1 / (1 + Math.exp(-logOdds));
  }

  const estimators = model.estimators;
  if (!estimators?.length) {
    throw new Error("The generated tree model is incomplete.");
  }
  return (
    estimators.reduce((sum, tree) => sum + predictTree(tree, scaled), 0) /
    estimators.length
  );
}

export const predictionModelName =
  model.kind === "forest" ? "Random forest" : "Logistic regression";
