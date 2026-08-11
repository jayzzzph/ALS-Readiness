# app/core/exceptions/user.py
from .base import AlreadyExistsError, NotFoundError, UnauthorizedError


class UserNotFoundError(NotFoundError):
    """Raised when a user with the given id/email does not exist."""
    message = "User not found."


class EmailAlreadyExistsError(AlreadyExistsError):
    """Raised when trying to register an existing email."""
    message = "A user with this email already exists."


class InactiveUserError(UnauthorizedError):
    """Raised when an operation requires an active user, but the user is deactivated."""
    message = "This user account is inactive."