# ================ Base Errors ================

class AppError(Exception):
    """Base for all domain/application exceptions. Never raised directly."""
    message = "An unexpected error occurred."
    code = "APP" 

    def __init__(self, message: str | None = None):
        self.message = message or self.message
        super().__init__(self.message)


class NotFoundError(AppError):
    """Base for all 'resource does not exist' errors."""

    message = "Resource not found."
    code = "NOT_FOUND"


class AlreadyExistsError(AppError):
    """Base for all 'duplicate resource' errors."""

    message = "Resource already exists."
    code = "ALREADY_EXISTS"


class DomainValidationError(AppError):
    """Base for domain-rule violations beyond simple field validation."""

    message = "Invalid request."
    code = "VALIDATION"


class UnauthorizedError(AppError):
    """Base for permission/role mismatch errors."""

    message = "Not authorized to perform this action."
    code = "UNAUTHORIZED"


class UnauthenticatedError(AppError):
    """Base for authentication failures."""

    message = "Not authenticated to perform this action."
    code = "UNAUTHENTICATED"


# ================ Auth Errors ================

class InvalidCredentialsError(UnauthenticatedError):
    """Raised when the email or password is incorrect."""
    message = "Invalid credentials."
    code = "INVALID_CREDENTIALS"


class InvalidRefreshTokenError(UnauthenticatedError):
    """Raised when the refresh token is expired or invalid."""
    
    message = "Could not validate credentials."
    code = "INVALID_REFRESH_TOKEN"


class InvalidAccessTokenError(UnauthenticatedError):
    """Raised when the refresh token is expired or invalid."""

    message = "Could not validate credentials."
    code = "INVALID_ACCESS_TOKEN"


# ================ User Error ================

class UserNotFoundError(NotFoundError):
    """Raised when user does not exits."""

    message = "User not found."
    code = "USER_NOT_FOUND"


class InactiveUserError(UnauthenticatedError):
    """Raised when a user is inactive"""

    message = "User account is inactive."
    code = "INACTIVE_USER"
