from pydantic import BaseModel, EmailStr, Field

from app.enums.user import UserRole


class UserCreate(BaseModel):
    role: UserRole | None = Field(default=UserRole.LEARNER)

class UserUpdate(BaseModel):
    password: EmailStr | None
