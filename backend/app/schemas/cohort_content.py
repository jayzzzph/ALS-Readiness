from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CohortContentCreate(BaseModel):
    content_id: int


class CohortContentResponse(BaseModel):
    id: int
    cohort_id: int
    content_id: int
    assigned_by: int
    assigned_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
