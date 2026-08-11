# app/core/exceptions/auth.py
from .base import UnauthenticatedError  # or UnauthorizedError, per last message


class InvalidCredentialsError(UnauthenticatedError):
    """Raised when the email or password is incorrect."""
    message = "Invalid email or password."


class InvalidRefreshTokenError(UnauthenticatedError):
    """Raised when the refresh token is expired or invalid."""
    message = "Refresh token is invalid or expired."