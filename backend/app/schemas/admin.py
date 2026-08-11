from pydantic import BaseModel, EmailStr, Field

from .user import UserResponse
from .user_profile import UserProfileCreate, UserProfileResponse


class AdminRequestBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class AdminCreateLearnerRequest(AdminRequestBase):
    cohort_id: int | None
    profile: UserProfileCreate


class AdminCreateFacilitatorRequest(AdminRequestBase):
    profile: UserProfileCreate


class AdminCreateUserResponse(BaseModel):
    profile: UserProfileResponse
    user:UserResponse
