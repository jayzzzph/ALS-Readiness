from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    id_no: str = Field(max_length=20)
    password: str = Field(min_length=8, max_length=64)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
