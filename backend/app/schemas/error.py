from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    success: bool = Field(default=False)
    code: str
    message: str
    details: Any | None = Field(default=None)
