from sqlalchemy import ColumnElement, func, or_
from sqlalchemy.orm import InstrumentedAttribute


def normalize_search(search: str | None) -> str | None:
    """The search text with leading, trailing, and repeated spaces collapsed.
    None when there is nothing left to search for."""
    if not search:
        return None

    return " ".join(search.split()) or None


def person_search_condition(
    search: str,
    *,
    first_name: InstrumentedAttribute,
    last_name: InstrumentedAttribute,
    id_no: InstrumentedAttribute,
) -> ColumnElement[bool]:
    """Matches a person by first name, last name, the two together in either
    order, or id number. Case-insensitive, and anywhere in the value.

    The one place this rule lives: the facilitator's learner list and the
    admin's user list both use it, so they cannot drift apart.
    """
    # The text is matched literally: % and _ are not wildcards.
    escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped}%"

    return or_(
        first_name.ilike(pattern, escape="\\"),
        last_name.ilike(pattern, escape="\\"),
        id_no.ilike(pattern, escape="\\"),
        # The full name, in either order: "Ana Abad" and "Abad Ana".
        func.concat(first_name, " ", last_name).ilike(pattern, escape="\\"),
        func.concat(last_name, " ", first_name).ilike(pattern, escape="\\"),
    )
