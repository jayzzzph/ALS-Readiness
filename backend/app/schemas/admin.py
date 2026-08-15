from pydantic import BaseModel

from app.enums.user import UserRole

from .user_profile import UserProfileCreate, UserProfileResponse


class AdminUserCreateBase(UserProfileCreate):
    pass 


class AdminLearnerCreate(AdminUserCreateBase):
    pass


class AdminFacilitatorCreate(AdminUserCreateBase):
    pass


class AdminUserCreateResponse(BaseModel):
    user_id: int
    id_no: str
    password: str
    role: UserRole
    profile: UserProfileResponse
