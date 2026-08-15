from typing import Annotated

from app.core.constants import REFRESH_TOKEN_EXPIRE_DAYS
from app.core.exceptions.auth import InvalidCredentialsError, InvalidRefreshTokenError
from app.schemas.auth import LoginRequest, TokenResponse
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError

from ..deps import AuthServiceDep

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: AuthServiceDep,
):
    try:
        auth_tokens = await auth_service.login(
            LoginRequest(
                id_no=form_data.username,
                password=form_data.password,
            ),
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    response.set_cookie(
        key="refresh_token",
        value=auth_tokens.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS,
    )

    return TokenResponse(
        access_token=auth_tokens.access_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    auth_service: AuthServiceDep,
):
    refresh_token = request.cookies.get("refresh_token")
    
    try:
        auth_tokens = await auth_service.refresh(refresh_token)
    except InvalidRefreshTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    response.set_cookie(
            key="refresh_token",
            value=auth_tokens.refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS,
        )
    
    return TokenResponse(
        access_token=auth_tokens.access_token,
        token_type="bearer",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    auth_service: AuthServiceDep,
):
    refresh_token = request.cookies.get("refresh_token")
    await auth_service.logout(refresh_token)
    
    response.delete_cookie("refresh_token")
