from pydantic import BaseModel


class FacilitatorCreate(BaseModel):
    user_id: int
