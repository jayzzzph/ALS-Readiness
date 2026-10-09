from datetime import date, datetime

from pydantic import BaseModel

from app.enums.cohort import CohortMemberStatus, CohortStatus


class FacilitatorSchoolYearsResponse(BaseModel):
    school_years: list[str]
    current: str | None


class FacilitatorCohortItem(BaseModel):
    id: int
    name: str
    code: str | None
    school_year: str
    status: CohortStatus
    start_date: date | None
    end_date: date | None
    learner_count: int


class FacilitatorCohortListResponse(BaseModel):
    items: list[FacilitatorCohortItem]
    total: int


class FacilitatorRosterRow(BaseModel):
    # Deliberately slim: a facilitator sees who is in the cohort, not the
    # learner's birthdate, address, contact details, email, or gender.
    learner_id: int
    id_no: str | None
    first_name: str | None
    last_name: str | None
    status: CohortMemberStatus
    assigned_at: datetime


class FacilitatorCohortDetailResponse(FacilitatorCohortItem):
    roster: list[FacilitatorRosterRow]
