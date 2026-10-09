from datetime import datetime

from pydantic import BaseModel

from app.enums.user import UserRole

from .user_profile import UserProfileCreate, UserProfileResponse


class AdminLearnerCreate(UserProfileCreate):
    pass


class AdminFacilitatorCreate(UserProfileCreate):
    pass


class AdminAdminCreate(UserProfileCreate):
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
    # The ids the cohort assign endpoints take. Each is set only for that role.
    learner_id: int | None = None
    facilitator_id: int | None = None


class AdminUserListItem(BaseModel):
    id: int
    id_no: str | None
    role: UserRole
    is_active: bool
    first_name: str | None = None
    last_name: str | None = None
    created_at: datetime
    # The ids the cohort assign endpoints take. Each is set only for that role.
    learner_id: int | None = None
    facilitator_id: int | None = None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    page: int
    page_size: int
