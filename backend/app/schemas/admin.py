from datetime import datetime

from pydantic import BaseModel

from app.enums.user import UserRole

from .user_profile import UserProfileCreate, UserProfileResponse


class AdminLearnerCreate(UserProfileCreate):
    pass


class AdminFacilitatorCreate(UserProfileCreate):
    pass


class AdminUserCreateResponse(BaseModel):
    user_id: int
    id_no: str
    password: str
    role: UserRole
    is_active: bool
    profile: UserProfileResponse
    created_at: datetime
    updated_at: datetime
