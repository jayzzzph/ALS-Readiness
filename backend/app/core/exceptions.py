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


class NotAnAdminError(DomainValidationError):
    """Raised when an admin-only action targets a user who is not an admin."""

    message = "Target user is not an admin."
    code = "NOT_AN_ADMIN"


class UserAlreadyActiveError(DomainValidationError):
    """Raised when approving a user who is already active."""

    message = "User is already active."
    code = "USER_ALREADY_ACTIVE"


class SelfApprovalError(DomainValidationError):
    """Raised when a super admin tries to approve their own account."""

    message = "You cannot approve your own account."
    code = "SELF_APPROVAL"


class MustChangePasswordError(UnauthorizedError):
    """Raised when a user with a pending forced password change calls a protected endpoint."""

    message = "You must change your password before continuing."
    code = "MUST_CHANGE_PASSWORD"


# ================ Strand Test Error ================

class StrandTestNotFoundError(NotFoundError):
    """Raised when a strand test is not found."""

    message = "Strand test not found."
    code = "STRAND_TEST_NOT_FOUND"


class StrandTestItemOptionNotFoundError(NotFoundError):
    """Raised when a strand test item option is not found."""
    
    message = "Strand test item option not found."
    code = "STRAND_TEST_ITEM_OPTION_NOT_FOUND"


class StrandTestAttemptNotFoundError(NotFoundError):
    """Raised when a learner has no attempt for a strand test."""

    message = "Strand test attempt not found."
    code = "STRAND_TEST_ATTEMPT_NOT_FOUND"


class StrandTestAttemptAlreadyExistsError(AlreadyExistsError):
    """Raised when a learner submits a second attempt for the same strand test."""

    message = "You have already submitted an attempt for this test."
    code = "STRAND_TEST_ATTEMPT_ALREADY_EXISTS"


class PretestRequiredError(DomainValidationError):
    """Raised when a posttest is submitted before the pretest for the same strand."""

    message = "Complete the pretest for this strand before taking the posttest."
    code = "PRETEST_REQUIRED"


class InvalidTestAttemptError(DomainValidationError):
    """Raised when an attempt's answers don't fit the test: a duplicate or
    foreign item (both tests), or a missing one (LRI only - a strand attempt may
    leave items unanswered, which score as incorrect)."""

    message = "Answers must include one valid response for every test item."
    code = "INVALID_TEST_ATTEMPT"


# ================ LRI Test Error ================


class LRITestNotFoundError(NotFoundError):
    """Raised when a LRI test is not found."""

    message = "LRI Test not found."
    code = "LRI_TEST_NOT_FOUND"


class LRITestAttemptNotFoundError(NotFoundError):
    """Raised when a learner has no attempt for an LRI test."""

    message = "LRI test attempt not found."
    code = "LRI_TEST_ATTEMPT_NOT_FOUND"


class LRITestAttemptAlreadyExistsError(AlreadyExistsError):
    """Raised when a learner submits a second attempt for the same LRI test."""

    message = "You have already submitted an attempt for this test."
    code = "LRI_TEST_ATTEMPT_ALREADY_EXISTS"


# ================ Learner Error ================

class LearnerNotFoundError(NotFoundError):
    """Raised when learner is not found."""

    message = "Learner not found."
    code = "LEARNER_NOT_FOUND"


# ================ Facilitator Errors ================

class FacilitatorNotFoundError(NotFoundError):
    """Raised when facilitator is not found."""

    message = "Facilitator not found."
    code = "FACILITATOR_NOT_FOUND"


# ================ User Profile Error ================

class UserProfileNotFoundError(NotFoundError):
    """Raised when a user profile is not found."""

    message = "User profile not found."
    code = "USER_PROFILE_NOT_FOUND"


# ================ Password Error ================

class IncorrectCurrentPasswordError(DomainValidationError):
    """Raised when a self-service password change supplies the wrong current password."""

    message = "Current password is incorrect."
    code = "INCORRECT_CURRENT_PASSWORD"


class PasswordReuseError(DomainValidationError):
    """Raised when the new password is the same as the current password."""

    message = "New password must be different from the current password."
    code = "PASSWORD_REUSE"


# ================ Cohort Error ================

class CohortCodeAlreadyExistsError(AlreadyExistsError):
    """Raised when creating a cohort with a code that already exists."""
    message = "Cohort code already exists."
    code = "COHORT_CODE_ALREADY_EXISTS"


class CohortNotFoundError(NotFoundError):
    """Raised when a cohort does not exists."""
    message = "Cohort does not exists."
    code = "COHORT_NOT_FOUND"


class InvalidCohortStatusError(DomainValidationError):
    """Raised when a cohort's status does not allow the requested operation."""

    message = "Cohort status does not allow this action."
    code = "INVALID_COHORT_STATUS"


class CohortLearnerAlreadyExistsError(AlreadyExistsError):
    """Raised when a learner is already enrolled in a cohort."""

    message = "Learner is already assigned to the cohort."
    code = "COHORT_LEARNER_ALREADY_EXISTS"


class CohortFacilitatorAlreadyExistsError(AlreadyExistsError):
    """Raised when a learner is already enrolled in a cohort."""

    message = "Facilitator is already assigned to the cohort."
    code = "COHORT_FACILITATOR_ALREADY_EXISTS"


class CohortLearnerNotFoundError(NotFoundError):
    """Raised when a cohort learner does not exists."""
    message = "Cohort learner does not exists."
    code = "COHORT_LEARNER_NOT_FOUND"


class CohortFacilitatorNotFoundError(NotFoundError):
    """Raised when a cohort facilitator does not exists."""
    message = "Cohort facilitator does not exists."
    code = "COHORT_FACILITATOR_NOT_FOUND"
    
    
class SelfPasswordResetNotAllowedError(UnauthorizedError):
    """Raised when an admin targets their own account with the admin password reset."""

    message = "You cannot reset your own password here. Use the change password option instead."
    code = "SELF_PASSWORD_RESET_NOT_ALLOWED"


class PasswordRequiredError(DomainValidationError):
    """Raised when resetting an admin's password without supplying a new one."""

    message = "A new password is required to reset an admin's password."
    code = "PASSWORD_REQUIRED"


class PasswordNotAllowedError(DomainValidationError):
    """Raised when a password is supplied for a reset that sets it automatically."""

    message = "Passwords for learners and facilitators are reset automatically; do not supply one."
    code = "PASSWORD_NOT_ALLOWED"
