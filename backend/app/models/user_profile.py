from datetime import date

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.enums.user import Gender


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"

    user_id: int = Field(primary_key=True, foreign_key="users.id")

    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)

    birthdate: date | None = Field(default=None)
    gender: Gender | None = Field(default=None)
    address: str | None = Field(default=None)
    contact_number: str | None = Field(default=None, max_length=20)
    contact_email: EmailStr | None = Field(default=None, max_length=254)
