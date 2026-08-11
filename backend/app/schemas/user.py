from pydantic import BaseModel, EmailStr, Field

from app.enums.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    role: UserRole = Field(default=UserRole.LEARNER)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
