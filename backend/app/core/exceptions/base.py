class AppError(Exception):
    """Base for all domain/application exceptions. Never raised directly."""
    message: str = "An unexpected error occurred."

    def __init__(self, message: str | None = None):
        self.message = message or self.message
        super().__init__(self.message)


class NotFoundError(AppError):
    """Base for all 'resource does not exist' errors."""
    message = "Resource not found."


class AlreadyExistsError(AppError):
    """Base for all 'duplicate resource' errors."""
    message = "Resource already exists."


class ValidationError(AppError):
    """Base for domain-rule violations beyond simple field validation."""
    message = "Invalid request."


class UnauthorizedError(AppError):
    """Base for permission/role mismatch errors."""
    message = "Not authorized to perform this action."


class UnauthenticatedError(AppError):
    """Base for permission/role mismatch errors."""
    message = "Not authenticated to perform this action."