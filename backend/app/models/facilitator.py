from sqlmodel import Field, SQLModel


class Facilitator(SQLModel, table=True):
    __tablename__ = "facilitators"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
