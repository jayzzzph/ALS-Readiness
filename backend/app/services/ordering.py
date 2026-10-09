from collections import Counter
from typing import Protocol

from app.core.exceptions import InvalidReorderError


class HasId(Protocol):
    id: int | None


def order_by_ids[T: HasId](items: list[T], ids: list[int]) -> list[T]:
    """Return `items` in the order given by `ids`.

    `ids` must name every item exactly once and nothing else; otherwise the
    request is rejected with the problems listed.
    """
    by_id = {item.id: item for item in items}

    duplicated = sorted(item_id for item_id, count in Counter(ids).items() if count > 1)
    missing = sorted(set(by_id) - set(ids))
    unknown = sorted(set(ids) - set(by_id))

    problems = []
    if missing:
        problems.append(f"missing {missing}")
    if unknown:
        problems.append(f"not active items of this parent {unknown}")
    if duplicated:
        problems.append(f"listed more than once {duplicated}")

    if problems:
        raise InvalidReorderError(
            "The order must list every active item exactly once: " + "; ".join(problems) + "."
        )

    return [by_id[item_id] for item_id in ids]
