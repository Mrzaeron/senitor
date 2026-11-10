"""Train and evaluate synthetic success-prediction baselines."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    ConfusionMatrixDisplay,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    RocCurveDisplay,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from senitor_ml import FEATURE_COLUMNS, TARGET_COLUMN
from senitor_ml.data import generate_synthetic_dataset
from senitor_ml.export import export_inference_model

RANDOM_STATE = 42


def split_by_student(
    frame: pd.DataFrame, random_state: int = RANDOM_STATE
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Return train/validation/test subsets with disjoint student groups."""
    groups = frame["student_id"]
    first_split = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=random_state)
    train_validation_idx, test_idx = next(
        first_split.split(frame, frame[TARGET_COLUMN], groups)
    )
    train_validation = frame.iloc[train_validation_idx]
    second_split = GroupShuffleSplit(
        n_splits=1, test_size=0.1765, random_state=random_state + 1
    )
    train_idx, validation_idx = next(
        second_split.split(
            train_validation,
            train_validation[TARGET_COLUMN],
            train_validation["student_id"],
        )
    )
    return (
        train_validation.iloc[train_idx].copy(),
        train_validation.iloc[validation_idx].copy(),
        frame.iloc[test_idx].copy(),
    )


def make_models() -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline(
            [
                ("scale", StandardScaler()),
                ("classifier", LogisticRegression(max_iter=1000, random_state=RANDOM_STATE)),
            ]
        ),
        "decision_tree": Pipeline(
            [
                ("scale", StandardScaler()),
                (
                    "classifier",
                    DecisionTreeClassifier(
                        max_depth=8, min_samples_leaf=10, random_state=RANDOM_STATE
                    ),
                ),
            ]
        ),
        "random_forest": Pipeline(
            [
                ("scale", StandardScaler()),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=50,
                        max_depth=6,
                        min_samples_leaf=10,
                        class_weight="balanced",
                        n_jobs=-1,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


def calculate_metrics(model: Pipeline, features: pd.DataFrame, target: pd.Series) -> dict[str, float | None]:
    predictions = model.predict(features)
    probabilities = model.predict_proba(features)[:, 1]
    return {
        "accuracy": float(accuracy_score(target, predictions)),
        "precision": float(precision_score(target, predictions, zero_division=0)),
        "recall": float(recall_score(target, predictions, zero_division=0)),
        "f1": float(f1_score(target, predictions, zero_division=0)),
        "roc_auc": (
            float(roc_auc_score(target, probabilities))
            if target.nunique() == 2
            else None
        ),
    }


def _feature_importance(model: Pipeline) -> dict[str, float]:
    classifier = model.named_steps["classifier"]
    if hasattr(classifier, "feature_importances_"):
        values = classifier.feature_importances_
    else:
        values = np.abs(classifier.coef_[0])
    return {
        name: float(value)
        for name, value in sorted(
            zip(FEATURE_COLUMNS, values, strict=True), key=lambda item: item[1], reverse=True
        )
    }


def _write_plots(
    models: dict[str, Pipeline],
    test_features: pd.DataFrame,
    test_target: pd.Series,
    best_name: str,
    output_dir: Path,
) -> None:
    figure, axes = plt.subplots(1, len(models), figsize=(12, 4))
    for axis, (name, model) in zip(axes, models.items(), strict=True):
        ConfusionMatrixDisplay.from_predictions(
            test_target, model.predict(test_features), ax=axis, colorbar=False
        )
        axis.set_title(name.replace("_", " ").title())
    figure.tight_layout()
    figure.savefig(output_dir / "confusion_matrices.png", dpi=150)
    plt.close(figure)

    figure, axis = plt.subplots(figsize=(7, 5))
    for name, model in models.items():
        RocCurveDisplay.from_estimator(model, test_features, test_target, ax=axis, name=name)
    axis.set_title("Held-out synthetic test ROC curves")
    figure.tight_layout()
    figure.savefig(output_dir / "roc_curves.png", dpi=150)
    plt.close(figure)

    importance = _feature_importance(models[best_name])
    names = list(importance)
    values = list(importance.values())
    figure, axis = plt.subplots(figsize=(8, 5))
    axis.barh(names[::-1], values[::-1])
    axis.set_title(f"Feature importance: {best_name.replace('_', ' ').title()}")
    figure.tight_layout()
    figure.savefig(output_dir / "feature_importance.png", dpi=150)
    plt.close(figure)


def train_and_evaluate(
    frame: pd.DataFrame,
    output_dir: Path,
    random_state: int = RANDOM_STATE,
    model_export_path: Path | None = None,
) -> dict[str, Any]:
    train_frame, validation_frame, test_frame = split_by_student(frame, random_state)
    features_train = train_frame.loc[:, FEATURE_COLUMNS]
    features_validation = validation_frame.loc[:, FEATURE_COLUMNS]
    features_test = test_frame.loc[:, FEATURE_COLUMNS]
    target_train = train_frame[TARGET_COLUMN]
    target_validation = validation_frame[TARGET_COLUMN]
    target_test = test_frame[TARGET_COLUMN]

    models = make_models()
    validation_metrics: dict[str, dict[str, float | None]] = {}
    for model in models.values():
        model.fit(features_train, target_train)
    for name, model in models.items():
        validation_metrics[name] = calculate_metrics(
            model, features_validation, target_validation
        )
    best_name = max(
        models,
        key=lambda name: (
            validation_metrics[name]["f1"],
            validation_metrics[name]["roc_auc"] or 0.0,
            validation_metrics[name]["accuracy"],
        ),
    )

    final_model = make_models()[best_name]
    final_train = pd.concat([train_frame, validation_frame], ignore_index=True)
    final_model.fit(final_train.loc[:, FEATURE_COLUMNS], final_train[TARGET_COLUMN])
    models[best_name] = final_model

    test_metrics = {
        name: calculate_metrics(model, features_test, target_test)
        for name, model in models.items()
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, output_dir / "best_model.joblib")
    inference_json = (
        json.dumps(export_inference_model(final_model), separators=(",", ":")) + "\n"
    )
    (output_dir / "inference_model.json").write_text(inference_json, encoding="utf-8")
    if model_export_path is not None:
        model_export_path.parent.mkdir(parents=True, exist_ok=True)
        model_export_path.write_text(inference_json, encoding="utf-8")
    report: dict[str, Any] = {
        "synthetic_data": True,
        "interpretation": "Proof-of-concept metrics only; not validated real-world student performance.",
        "random_state": random_state,
        "split_strategy": "student-grouped train/validation/test; identifiers excluded from features",
        "row_counts": {
            "train": int(len(train_frame)),
            "validation": int(len(validation_frame)),
            "test": int(len(test_frame)),
        },
        "selected_model": best_name,
        "selection_metric": "validation F1, then validation ROC-AUC, then validation accuracy",
        "validation_metrics": validation_metrics,
        "test_metrics": test_metrics,
        "feature_importance": _feature_importance(final_model),
        "features": list(FEATURE_COLUMNS),
        "threshold": 0.5,
    }
    (output_dir / "metrics.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    _write_plots(models, features_test, target_test, best_name, output_dir)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--students", type=int, default=400)
    parser.add_argument("--interactions-per-student", type=int, default=24)
    parser.add_argument("--seed", type=int, default=RANDOM_STATE)
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts"))
    parser.add_argument(
        "--model-export",
        type=Path,
        default=Path(__file__).parents[2] / "models" / "success_model.json",
    )
    args = parser.parse_args()

    frame = generate_synthetic_dataset(
        args.students, args.interactions_per_student, args.seed
    )
    args.output_dir.mkdir(parents=True, exist_ok=True)
    frame.to_csv(args.output_dir / "synthetic_interactions.csv", index=False)
    report = train_and_evaluate(
        frame, args.output_dir, args.seed, args.model_export
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
