import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from .api.router import router as api_router
from .core.exceptions import NotFoundError, UnauthenticatedError, UnauthorizedError
from .schemas.error import ErrorResponse

app = FastAPI()
app.include_router(api_router)


# ================ Global Exception Handling ================

logger = logging.getLogger(__name__)


def error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Any | None = None,
):
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            success=False, code=error_code, message=message, details=details
        ).model_dump(),
    )


@app.exception_handler(NotFoundError)
async def handle_not_found(_: Request, exc: NotFoundError):
    return error_response(
        status_code=status.HTTP_404_NOT_FOUND,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(UnauthenticatedError)
async def handle_unauthenticated(_: Request, exc: UnauthenticatedError):
    return error_response(
        status_code=status.HTTP_401_UNAUTHORIZED,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(UnauthorizedError)
async def handle_unauthorized(_: Request, exc: UnauthorizedError):
    return error_response(
        status_code=status.HTTP_403_FORBIDDEN,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception):
    logger.exception("Unhandled exception")

    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred.",
    )
