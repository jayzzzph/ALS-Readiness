from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.enums.cohort import CohortStatus

from .cohort_facilitator import CohortFacilitatorResponse
from .cohort_learner import CohortLearnerResponse
from .user_profile import UserProfileResponse


class CohortCreate(BaseModel):
    name: str = Field(max_length=100)
    school_year: str
    start_date: date
    end_date: date


class CohortResponse(BaseModel):
    id: int
    name: str
    school_year: str
    start_date: date
    end_date: date
    code: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    status: CohortStatus

    model_config = ConfigDict(from_attributes=True)


class CohortStatusUpdate(BaseModel):
    status: CohortStatus


class CohortListResponse(BaseModel):
    cohorts: list[CohortResponse]


class CohortFacilitatorMemberResponse(CohortFacilitatorResponse):
    profile: UserProfileResponse


class CohortLearnerMemberResponse(CohortLearnerResponse):
    profile: UserProfileResponse


class CohortWithMembersResponse(CohortResponse):
    facilitators: list[CohortFacilitatorMemberResponse]
    learners: list[CohortLearnerMemberResponse]
