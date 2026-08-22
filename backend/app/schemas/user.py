from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict

from app.enums.user import UserRole


class UserCreate(BaseModel):
    role: UserRole | None = Field(default=UserRole.LEARNER)


class UserPasswordUpdate(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    id_no: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
