import re
from datetime import date, datetime
from typing import Annotated, Self

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from app.enums.cohort import CohortStatus

from .cohort_facilitator import CohortFacilitatorResponse
from .cohort_learner import CohortLearnerResponse

# Two consecutive years, e.g. "2026-2027". The generated cohort code embeds the
# school year, so a fixed nine-character value also keeps the code within its
# varchar(20) column.
SCHOOL_YEAR_PATTERN = re.compile(r"([0-9]{4})-([0-9]{4})")


def validate_school_year(value: str) -> str:
    match = SCHOOL_YEAR_PATTERN.fullmatch(value)
    if match is None or int(match.group(2)) != int(match.group(1)) + 1:
        raise ValueError(
            "School year must be two consecutive years in the form YYYY-YYYY, e.g. 2026-2027."
        )

    return value


# Used for request bodies and query parameters alike.
SchoolYear = Annotated[str, AfterValidator(validate_school_year)]


class CohortCreate(BaseModel):
    name: str = Field(max_length=100)
    school_year: SchoolYear
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def check_dates(self) -> Self:
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date.")

        return self


class CohortResponse(BaseModel):
    id: int
    name: str
    school_year: str
    start_date: date | None
    end_date: date | None
    code: str | None
    created_by: int
    created_at: datetime
    updated_at: datetime
    status: CohortStatus

    model_config = ConfigDict(from_attributes=True)


class CohortStatusUpdate(BaseModel):
    status: CohortStatus


class CohortListResponse(BaseModel):
    cohorts: list[CohortResponse]


class CohortMemberProfile(BaseModel):
    """What the roster shows of a member's profile: the name. The birthdate,
    address, contact number, and email are not part of a roster."""

    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class CohortFacilitatorMemberResponse(CohortFacilitatorResponse):
    profile: CohortMemberProfile
    # The facilitator's ID number, so a roster row can be read without a second lookup.
    id_no: str | None = None
    # When the assignment ended. Null while it is active.
    ended_at: datetime | None = None


class CohortLearnerMemberResponse(CohortLearnerResponse):
    profile: CohortMemberProfile
    # The learner's ID number, so a roster row can be read without a second lookup.
    id_no: str | None = None
    # When the membership ended. Null while it is active.
    ended_at: datetime | None = None


class CohortWithMembersResponse(CohortResponse):
    facilitators: list[CohortFacilitatorMemberResponse]
    learners: list[CohortLearnerMemberResponse]
