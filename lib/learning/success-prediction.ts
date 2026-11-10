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

const model = modelBundle as ExportedModel;
const expectedFeatures: (keyof PredictionFeatures)[] = [
  "previous_accuracy",
  "attempts_per_problem",
  "topic_familiarity",
  "problem_difficulty",
  "recent_success_rate",
  "related_topic_performance",
  "learning_activity_hours",
];

if (
  model.version !== 1 ||
  model.features.length !== expectedFeatures.length ||
  model.features.some((feature, index) => feature !== expectedFeatures[index])
) {
  throw new Error("The generated success model has an incompatible feature schema.");
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
