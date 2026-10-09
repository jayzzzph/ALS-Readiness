from datetime import datetime

from pydantic import BaseModel


class StrandAttemptAnswerCreate(BaseModel):
    item_id: int
    option_id: int


class StrandAttemptCreate(BaseModel):
    answers: list[StrandAttemptAnswerCreate]


class StrandAttemptResponse(BaseModel):
    attempt_id: int
    status: str


class StrandAttemptResultResponse(BaseModel):
    attempt_id: int
    test_id: int
    total_score: int  # raw count of correct answers
    item_count: int  # items in the test at submission time
    # Mean Percentage Score: total_score / item_count * 100, 2 dp. Null only for
    # an attempt with no items, which the submit endpoint does not allow.
    mps: float | None
    taken_at: datetime | None
