from datetime import date
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.enums.user import Gender


class UserProfileBase(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)

    birthdate: date | None = Field(default=None)
    gender: Gender | None = Field(default=None)
    address: str | None = Field(default=None)
    contact_number: str | None = Field(default=None, max_length=20)
    contact_email: EmailStr | None = Field(default=None, max_length=254)

    @field_validator(
        "first_name",
        "last_name",
        "middle_name",
        "address",
        "contact_number",
        mode="after",
    )
    @classmethod
    def strip_and_validate(cls, v: Any | None) -> str | None:
        if v is None:
            return v
            
        v = v.strip()
        return v or None


class UserProfileCreate(UserProfileBase):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    @field_validator(
        "first_name",
        "last_name",
        mode="before",
    )
    @classmethod
    def required_not_blank(cls, v: str | None) -> Any:
        if isinstance(v, str):
            return v.strip()

        return v


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    first_name: str
    last_name: str
