"""Export fitted scikit-learn models to a compact JSON inference format."""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.pipeline import Pipeline

from senitor_ml import FEATURE_COLUMNS


def export_inference_model(model: Pipeline) -> dict[str, Any]:
    scaler = model.named_steps["scale"]
    classifier = model.named_steps["classifier"]
    bundle: dict[str, Any] = {
        "version": 1,
        "features": list(FEATURE_COLUMNS),
        "mean": [float(value) for value in scaler.mean_],
        "scale": [float(value) for value in scaler.scale_],
    }

    if hasattr(classifier, "estimators_"):
        estimators = classifier.estimators_
        bundle["kind"] = "forest"
    elif hasattr(classifier, "tree_"):
        estimators = [classifier]
        bundle["kind"] = "forest"
    else:
        bundle.update(
            {
                "kind": "logistic",
                "coefficients": [
                    float(value) for value in classifier.coef_[0]
                ],
                "intercept": float(classifier.intercept_[0]),
            }
        )
        return bundle

    bundle["estimators"] = [
        {
            "left": [int(value) for value in estimator.tree_.children_left],
            "right": [int(value) for value in estimator.tree_.children_right],
            "feature": [int(value) for value in estimator.tree_.feature],
            "threshold": [float(value) for value in estimator.tree_.threshold],
            "positive_probability": [
                float(node_value[0][1] / np.sum(node_value[0]))
                if np.sum(node_value[0]) > 0
                else 0.0
                for node_value in estimator.tree_.value
            ],
        }
        for estimator in estimators
    ]
    return bundle


def predict_exported_probability(
    bundle: dict[str, Any], features: dict[str, float]
) -> float:
    """Evaluate an exported bundle with the same scaling and tree semantics."""
    scaled = [
        (features[name] - mean) / scale
        for name, mean, scale in zip(
            bundle["features"], bundle["mean"], bundle["scale"], strict=True
        )
    ]
    if bundle["kind"] == "logistic":
        log_odds = bundle["intercept"] + sum(
            coefficient * value
            for coefficient, value in zip(bundle["coefficients"], scaled, strict=True)
        )
        return float(1 / (1 + np.exp(-log_odds)))

    predictions: list[float] = []
    for tree in bundle["estimators"]:
        node = 0
        while tree["feature"][node] >= 0:
            feature_index = tree["feature"][node]
            node = (
                tree["left"][node]
                if scaled[feature_index] <= tree["threshold"][node]
                else tree["right"][node]
            )
        predictions.append(tree["positive_probability"][node])
    return float(np.mean(predictions))
