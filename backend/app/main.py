import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

from .api.router import router as api_router
from .core.config import settings
from .core.error_middleware import UnhandledErrorMiddleware
from .core.exceptions import (
    AlreadyExistsError,
    ConflictError,
    DomainValidationError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthenticatedError,
    UnauthorizedError,
)
from .schemas.error import ErrorResponse

app = FastAPI()

# The middleware added last is the outermost. This one is added first so that
# it sits inside the CORS middleware: the 500 it sends for an unexpected error
# then carries CORS headers like every other response.
app.add_middleware(UnhandledErrorMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    # Lets a browser on another origin read the CSV export's filename.
    expose_headers=["Content-Disposition"],
)

app.include_router(api_router)


# ========== General/Framework Exception Handling ==========

# Logger for printing errors in server terminal
logger = logging.getLogger(__name__)


# Base function for standardizing return JSON format
def error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Any | None = None,
):
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            success=False,
            code=error_code,
            message=message,
            details=details,
        ).model_dump(),
    )


# For handling unexcpected errors. UnhandledErrorMiddleware answers them first,
# inside the CORS middleware; this remains for anything raised outside it.
@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception):
    logger.exception("Unhandled error")

    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred.",
    )


# For handling internal pydantic schema error
@app.exception_handler(PydanticValidationError)
async def handle_pydantic_validation(
    _: Request,
    exc: PydanticValidationError,
):
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        error_code="PYDANTIC_VALIDATION",
        message="Invalid request data.",
        details=jsonable_encoder(exc.errors()),
    )


# For handling request validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
):
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        error_code="REQUEST_VALIDATION",
        message="Request validation failed.",
        details=jsonable_encoder(exc.errors()),
    )


# ========== Custom Category Exception Handlers ==========

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


@app.exception_handler(AlreadyExistsError)
async def handle_already_exists(_: Request, exc: AlreadyExistsError):
    return error_response(
        status_code=status.HTTP_409_CONFLICT,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(ConflictError)
async def handle_conflict(_: Request, exc: ConflictError):
    return error_response(
        status_code=status.HTTP_409_CONFLICT,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(DomainValidationError)
async def handle_domain_validation(_: Request, exc: DomainValidationError):
    return error_response(
        status_code=status.HTTP_400_BAD_REQUEST,
        error_code=exc.code,
        message=exc.message,
    )


@app.exception_handler(ServiceUnavailableError)
async def handle_service_unavailable(_: Request, exc: ServiceUnavailableError):
    return error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        error_code=exc.code,
        message=exc.message,
    )
