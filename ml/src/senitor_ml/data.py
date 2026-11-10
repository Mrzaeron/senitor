"""Synthetic DSA interaction data for reproducible model experiments."""

from __future__ import annotations

import numpy as np
import pandas as pd


def generate_synthetic_dataset(
    n_students: int = 400,
    interactions_per_student: int = 24,
    random_state: int = 42,
) -> pd.DataFrame:
    """Generate prior-only features and a noisy simulated problem outcome."""
    if n_students < 10:
        raise ValueError("n_students must be at least 10 for grouped evaluation.")
    if interactions_per_student < 1:
        raise ValueError("interactions_per_student must be positive.")

    rng = np.random.default_rng(random_state)
    rows: list[dict[str, float | int | str]] = []
    topic_names = ("arrays", "strings", "hashing", "two_pointers", "trees", "graphs")

    for student_number in range(n_students):
        student_id = f"synthetic-student-{student_number:05d}"
        ability = rng.beta(2.4, 2.1)
        student_accuracy = float(np.clip(rng.normal(ability, 0.12), 0.02, 0.98))

        for interaction_number in range(interactions_per_student):
            topic_familiarity = float(
                np.clip(rng.normal(ability, 0.2), 0.01, 0.99)
            )
            related_performance = float(
                np.clip(rng.normal(ability * 0.8 + topic_familiarity * 0.2, 0.18), 0, 1)
            )
            recent_success = float(np.clip(rng.normal(ability, 0.16), 0, 1))
            difficulty = int(rng.integers(1, 6))
            attempts = int(
                np.clip(
                    1 + np.floor((1 - ability) * 3 + (difficulty - 1) * 0.35 + rng.normal(0, 1)),
                    0,
                    6,
                )
            )
            activity_hours = float(np.clip(rng.gamma(2.0, 2.2), 0.1, 20.0))
            topic = topic_names[(student_number + interaction_number) % len(topic_names)]

            log_odds = (
                -0.75
                + 2.1 * (student_accuracy - 0.5)
                + 0.65 * (topic_familiarity - 0.5)
                - 0.8 * (difficulty - 3)
                + 1.15 * (recent_success - 0.5)
                + 0.75 * (related_performance - 0.5)
                + 0.035 * (activity_hours - 4.0)
                - 0.12 * (attempts - 2)
            )
            probability = 1 / (1 + np.exp(-log_odds))

            rows.append(
                {
                    "student_id": student_id,
                    "problem_id": f"synthetic-problem-{interaction_number:03d}",
                    "topic": topic,
                    "previous_accuracy": student_accuracy,
                    "attempts_per_problem": attempts,
                    "topic_familiarity": topic_familiarity,
                    "problem_difficulty": difficulty,
                    "recent_success_rate": recent_success,
                    "related_topic_performance": related_performance,
                    "learning_activity_hours": activity_hours,
                    "solved": int(rng.random() < probability),
                }
            )

    return pd.DataFrame(rows)
