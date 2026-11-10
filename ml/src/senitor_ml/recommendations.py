"""Interpretable mastery and next-problem recommendation baseline."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable, Mapping, Sequence


TOPIC_PREREQUISITES: dict[str, tuple[str, ...]] = {
    "programming-fundamentals": (),
    "time-and-space-complexity": ("programming-fundamentals",),
    "arrays": ("time-and-space-complexity",),
    "strings": ("arrays",),
    "searching-and-sorting": ("arrays",),
    "hashing": ("arrays",),
    "two-pointers-and-sliding-window": ("arrays", "strings"),
    "linked-lists": ("arrays",),
    "stacks-and-queues": ("arrays",),
    "recursion-and-backtracking": ("arrays",),
    "trees-and-binary-search-trees": ("recursion-and-backtracking",),
    "heaps-and-priority-queues": ("trees-and-binary-search-trees",),
    "graphs": ("trees-and-binary-search-trees",),
    "greedy-algorithms": ("arrays",),
    "dynamic-programming": ("recursion-and-backtracking",),
    "tries": ("strings", "trees-and-binary-search-trees"),
    "bit-manipulation": ("arrays",),
}


def estimate_topic_mastery(
    submissions: Iterable[Mapping[str, object]],
    topics: Iterable[str] = TOPIC_PREREQUISITES,
    recent_limit: int = 10,
) -> dict[str, float]:
    """Estimate mastery using recent correctness with a neutral prior."""
    if recent_limit < 1:
        raise ValueError("recent_limit must be positive.")

    attempts_by_topic: dict[str, list[float]] = defaultdict(list)
    for submission in submissions:
        topic = submission.get("topic")
        solved = submission.get("solved")
        if not isinstance(topic, str) or not isinstance(solved, (bool, int, float)):
            continue
        if float(solved) not in (0.0, 1.0):
            continue
        attempts_by_topic[topic].append(float(solved))

    mastery: dict[str, float] = {}
    for topic in topics:
        recent = attempts_by_topic[topic][-recent_limit:]
        mastery[topic] = (sum(recent) + 1.0) / (len(recent) + 2.0)
    return mastery


def recommend_learning_path(
    mastery: Mapping[str, float],
    problems: Sequence[Mapping[str, object]],
    *,
    prerequisites: Mapping[str, Sequence[str]] | None = None,
    prerequisite_threshold: float = 0.55,
    target_mastery: float = 0.7,
    problem_limit: int = 3,
) -> dict[str, object]:
    """Select an unlocked weak topic and problems with explicit reasons."""
    if problem_limit < 1:
        raise ValueError("problem_limit must be positive.")

    topic_prerequisites = prerequisites or TOPIC_PREREQUISITES
    known_topics = set(topic_prerequisites) | set(mastery)
    normalized_mastery = {
        topic: min(1.0, max(0.0, float(mastery.get(topic, 0.5))))
        for topic in known_topics
    }
    weak_topics = sorted(
        (topic for topic, score in normalized_mastery.items() if score < target_mastery),
        key=lambda topic: (normalized_mastery[topic], topic),
    )
    eligible_topics = [
        topic
        for topic in weak_topics
        if all(
            normalized_mastery.get(prerequisite, 0.5) >= prerequisite_threshold
            for prerequisite in topic_prerequisites.get(topic, ())
        )
    ]
    next_topic = eligible_topics[0] if eligible_topics else (weak_topics[0] if weak_topics else None)

    selected_problems: list[dict[str, object]] = []
    if next_topic is not None:
        score = normalized_mastery[next_topic]
        target_difficulty = "easy" if score < 0.4 else "medium" if score < 0.7 else "hard"
        candidates = [
            problem
            for problem in problems
            if problem.get("topic") == next_topic
        ]
        candidates.sort(
            key=lambda problem: (
                problem.get("difficulty") != target_difficulty,
                str(problem.get("title", problem.get("id", ""))).casefold(),
            )
        )
        prerequisite_note = ""
        topic_dependencies = topic_prerequisites.get(next_topic, ())
        if topic_dependencies:
            prerequisite_note = (
                "Prerequisites meet the mastery threshold: "
                + ", ".join(topic_dependencies)
                + ". "
            )
        for problem in candidates[:problem_limit]:
            selected_problems.append(
                {
                    "id": problem.get("id"),
                    "title": problem.get("title", "Untitled problem"),
                    "topic": next_topic,
                    "difficulty": problem.get("difficulty", target_difficulty),
                    "reason": (
                        f"{prerequisite_note}{next_topic} mastery is "
                        f"{score:.0%}, below the {target_mastery:.0%} target; "
                        f"this problem is suited to the current level."
                    ),
                }
            )

    return {
        "topic_mastery": normalized_mastery,
        "weak_topics": weak_topics,
        "recommended_next_topic": next_topic,
        "recommended_problems": selected_problems,
        "explanation": (
            f"Selected {next_topic} because it is the weakest topic whose "
            "prerequisites are satisfied."
            if next_topic
            else "No weak topics remain below the mastery target."
        ),
    }
