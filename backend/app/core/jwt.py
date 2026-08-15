from datetime import datetime, timedelta, timezone
from typing import Any, Type

import jwt
from jwt import InvalidTokenError

from app.core.config import settings
from app.core.constants import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.exceptions.auth import InvalidRefreshTokenError
from app.enums.token import TokenType

from .constants import SIGNING_ALGORITHM

ACCESS_TOKEN_SECRET_KEY = settings.access_token_secret_key
REFRESH_TOKEN_SECRET_KEY = settings.refresh_token_secret_key


def create_token(payload: dict[str, Any], secret_key: str) -> str:
    return jwt.encode(
        payload=payload,
        key=secret_key,
        algorithm=SIGNING_ALGORITHM,
    )


def create_access_token(payload: dict[str, Any]) -> str:
    return create_token(payload, ACCESS_TOKEN_SECRET_KEY)


def create_refresh_token(payload: dict[str, Any]) -> str:
    return create_token(payload, REFRESH_TOKEN_SECRET_KEY)


def decode_token(token: str, secret_key: str, invalid_token_error: Type[Exception]) -> dict[str, Any]:
    try:
        return jwt.decode(
            jwt=token,
            key=secret_key,
            algorithms=[SIGNING_ALGORITHM],
        )
    except InvalidTokenError as e:
        raise InvalidRefreshTokenError() from e


def decode_access_token(token: str) -> dict[str, Any]:
    return decode_token(token, ACCESS_TOKEN_SECRET_KEY)


def decode_refresh_token(token: str) -> dict[str, Any]:
    return decode_token(token, REFRESH_TOKEN_SECRET_KEY)


def issue_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
        "type": TokenType.ACCESS.value,
    }

    token = create_access_token(payload)

    return token
