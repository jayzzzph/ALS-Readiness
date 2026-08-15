from enum import StrEnum


class CohortStatus(StrEnum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CohortMemberStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class CohortFacilitatorStatus(StrEnum):
    ACTIVE = "active"
    ENDED = "ended"
    REMOVED = "removed"
