from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import joblib

from senitor_ml.data import generate_synthetic_dataset
from senitor_ml.export import predict_exported_probability
from senitor_ml.recommendations import (
    estimate_topic_mastery,
    recommend_learning_path,
)
from senitor_ml.train import split_by_student, train_and_evaluate


class SyntheticModelTests(unittest.TestCase):
    def test_generated_data_is_reproducible_and_prior_features_are_bounded(self) -> None:
        first = generate_synthetic_dataset(20, 5, 7)
        second = generate_synthetic_dataset(20, 5, 7)
        self.assertTrue(first.equals(second))
        for column in (
            "previous_accuracy",
            "topic_familiarity",
            "recent_success_rate",
            "related_topic_performance",
        ):
            self.assertTrue(first[column].between(0, 1).all())
        self.assertTrue(set(first["solved"].unique()).issubset({0, 1}))

    def test_student_groups_do_not_cross_data_splits(self) -> None:
        frame = generate_synthetic_dataset(40, 6, 12)
        train, validation, test = split_by_student(frame, 12)
        groups = [set(part["student_id"]) for part in (train, validation, test)]
        self.assertFalse(groups[0] & groups[1])
        self.assertFalse(groups[0] & groups[2])
        self.assertFalse(groups[1] & groups[2])

    def test_training_writes_model_metrics_and_plots(self) -> None:
        frame = generate_synthetic_dataset(40, 6, 21)
        with tempfile.TemporaryDirectory() as temporary_directory:
            output = Path(temporary_directory)
            report = train_and_evaluate(frame, output, 21)
            self.assertIn(report["selected_model"], {
                "logistic_regression",
                "decision_tree",
                "random_forest",
            })
            self.assertEqual(set(report["test_metrics"]), {
                "logistic_regression",
                "decision_tree",
                "random_forest",
            })
            fitted_model = joblib.load(output / "best_model.joblib")
            bundle = json.loads((output / "inference_model.json").read_text())
            sample = frame.iloc[0]
            features = {
                name: float(sample[name]) for name in bundle["features"]
            }
            expected = fitted_model.predict_proba(
                frame.loc[[sample.name], bundle["features"]]
            )[0, 1]
            actual = predict_exported_probability(bundle, features)
            self.assertAlmostEqual(actual, expected, places=12)
            for name in (
                "best_model.joblib",
                "inference_model.json",
                "metrics.json",
                "confusion_matrices.png",
                "roc_curves.png",
                "feature_importance.png",
            ):
                self.assertTrue((output / name).is_file(), name)


class RecommendationTests(unittest.TestCase):
    def test_mastery_uses_recent_outcomes_with_a_neutral_prior(self) -> None:
        mastery = estimate_topic_mastery(
            [
                {"topic": "arrays", "solved": True},
                {"topic": "arrays", "solved": False},
                {"topic": "arrays", "solved": True},
            ],
            topics=("arrays", "graphs"),
        )
        self.assertAlmostEqual(mastery["arrays"], 0.6)
        self.assertEqual(mastery["graphs"], 0.5)

    def test_problem_recommendation_observes_prerequisites_and_explains(self) -> None:
        result = recommend_learning_path(
            {"arrays": 0.9, "strings": 0.2},
            [
                {"id": "p1", "title": "String scan", "topic": "strings", "difficulty": "easy"},
                {"id": "p2", "title": "String window", "topic": "strings", "difficulty": "medium"},
            ],
        )
        self.assertEqual(result["recommended_next_topic"], "strings")
        self.assertEqual(result["recommended_problems"][0]["id"], "p1")
        self.assertIn("Prerequisites", result["recommended_problems"][0]["reason"])


if __name__ == "__main__":
    unittest.main()
