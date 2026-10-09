from collections.abc import Iterable

from app.enums.strand_test import StrandTestType
from app.models.strand_test_attempt import StrandTestAttempt


def compute_mps(total_score: int, item_count: int) -> float | None:
    """Mean Percentage Score of one attempt: the share of items answered
    correctly, as a percentage to two decimal places. None when the attempt
    has no items, since there is nothing to take a share of.

    The only place the formula is written. The learner's own result and the
    facilitator's views both call it, so they cannot disagree.
    """
    if item_count == 0:
        return None

    return round(total_score / item_count * 100, 2)


def latest_attempts(
    attempts: Iterable[tuple[StrandTestAttempt, StrandTestType, int]],
) -> dict[tuple[int, int, StrandTestType], StrandTestAttempt]:
    """Each learner's latest attempt per strand and test type, keyed by
    (learner_id, strand_id, test type).

    `attempts` are (attempt, test type, strand id) rows, oldest first, so
    where a strand has more than one test of a type the latest one is kept.
    """
    latest: dict[tuple[int, int, StrandTestType], StrandTestAttempt] = {}
    for attempt, test_type, strand_id in attempts:
        latest[(attempt.learner_id, strand_id, test_type)] = attempt
    return latest
