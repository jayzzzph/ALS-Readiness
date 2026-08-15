from sqlmodel import Field, SQLModel


class Learner(SQLModel, table=True):
    __tablename__ = "learners"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
