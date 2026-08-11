from datetime import date

from pydantic import BaseModel, Field

from app.enums.user import Gender


class UserProfileBase(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)

    birthdate: date | None = Field(default=None)
    gender: Gender | None = Field(default=None)
    address: str | None = Field(default=None)
    contact_number: str | None = Field(default=None, max_length=20)


class UserProfileCreate(UserProfileBase):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    user_id: int
