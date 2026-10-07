from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ContentProgressUpdate(BaseModel):
    last_accessed_at: datetime | None
    completed_at: datetime | None


class ContentProgressCreate(BaseModel):
    last_accessed_at: datetime | None


class ContentProgressResponse(BaseModel):
    content_id: int
    last_accessed_at: datetime | None
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
