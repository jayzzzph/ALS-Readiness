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


class ServiceUnavailableError(AppError):
    """Base for failures of an external service the request depends on."""

    message = "Service temporarily unavailable."
    code = "SERVICE_UNAVAILABLE"


class ConflictError(AppError):
    """Base for requests the resource's current state does not allow."""

    message = "The request conflicts with the current state of the resource."
    code = "CONFLICT"


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


class IntakeRequiredError(ConflictError):
    """Raised when a pretest is submitted by a learner with no participant intake."""

    message = "Complete your Participant Intake before taking a pretest."
    code = "INTAKE_REQUIRED"


class LRIRequiredError(ConflictError):
    """Raised when a pretest is submitted before the Learner Readiness Inventory."""

    message = "Complete the Learner Readiness Inventory before taking a pretest."
    code = "LRI_REQUIRED"


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


class CohortAccessDeniedError(UnauthorizedError):
    """Raised when the caller may not see a cohort or one of its learners.

    The message is the same whether or not the cohort or learner exists, so a
    denied caller learns nothing about what is there.
    """

    message = "You do not have access to this cohort or learner."
    code = "COHORT_ACCESS_DENIED"


class CohortNotActiveError(ConflictError):
    """Raised when a change is made to a cohort the caller can see but which is not active."""

    message = "This cohort is not active, so it cannot be changed."
    code = "COHORT_NOT_ACTIVE"


class LearnerAlreadyInActiveCohortError(AlreadyExistsError):
    """Raised when assigning a learner who already has an active membership in a cohort."""

    message = "Learner already has an active cohort. End that membership first."
    code = "LEARNER_ALREADY_IN_ACTIVE_COHORT"


class LearnerNotInCohortError(NotFoundError):
    """Raised when a learner has no active cohort membership."""

    message = "Learner is not assigned to a cohort."
    code = "LEARNER_NOT_IN_COHORT"

    
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


# ================ At-Risk Flag Error ================

class AtRiskFlagClosedError(ConflictError):
    """Raised when changing a flag whose episode has ended: a resolved flag, or
    a dismissed one whose condition has since cleared."""

    message = "This flag is closed because its condition has cleared, so it cannot be changed."
    code = "AT_RISK_FLAG_CLOSED"


class InvalidAtRiskFlagTransitionError(ConflictError):
    """Raised when a flag is set to the status it already has and no note is
    sent. With a note, the same status is allowed: it edits the note."""

    message = "The flag already has this status."
    code = "AT_RISK_FLAG_INVALID_TRANSITION"


# ================ Content Error ================

class ContentNotFoundError(NotFoundError):
    """Raised when accessing a content that does not exists."""

    message = "Content not found."
    code = "CONTENT_NOT_FOUND"


class ContentFileNotFoundError(NotFoundError):
    """Raised when no uploaded file exists in storage at the given key."""

    message = "File not found at the given key."
    code = "CONTENT_FILE_NOT_FOUND"


class ContentFileKeyAlreadyUsedError(AlreadyExistsError):
    """Raised when creating content from a file key another content already uses."""

    message = "This uploaded file is already used by another content item."
    code = "CONTENT_FILE_KEY_ALREADY_USED"


class InvalidContentFileError(DomainValidationError):
    """Raised when a content filename or file key has a missing or unsupported extension."""

    message = "Unsupported content file."
    code = "INVALID_CONTENT_FILE"


class StorageUnavailableError(ServiceUnavailableError):
    """Raised when the file storage service cannot be reached."""

    message = "Storage service unavailable."
    code = "STORAGE_UNAVAILABLE"


class ContentEditDeniedError(UnauthorizedError):
    """Raised when a caller who can see a content tries to edit one they did not upload."""

    message = "Only the uploader can edit this content."
    code = "CONTENT_EDIT_DENIED"


class ContentEvaluationAlreadyExistsError(AlreadyExistsError):
    """Raised when saving an evaluation for a content that already has one."""

    message = "This content already has an evaluation."
    code = "CONTENT_EVALUATION_ALREADY_EXISTS"


# ================ Curriculum Error ================

class LearningStrandNotFoundError(NotFoundError):
    """Raised when a learning strand does not exist."""

    message = "Strand not found."
    code = "LEARNING_STRAND_NOT_FOUND"


class CurriculumModuleNotFoundError(NotFoundError):
    """Raised when a curriculum module does not exist. (Not named ModuleNotFoundError,
    which would shadow the Python built-in.)"""

    message = "Module not found."
    code = "MODULE_NOT_FOUND"


class LessonNotFoundError(NotFoundError):
    """Raised when a lesson does not exist."""

    message = "Lesson not found."
    code = "LESSON_NOT_FOUND"


class StrandNotActiveError(ConflictError):
    """Raised when adding to a strand that is archived or deleted."""

    message = "This strand is not active, so nothing can be added to it."
    code = "STRAND_NOT_ACTIVE"


class ModuleNotActiveError(ConflictError):
    """Raised when adding to, or using content under, a module that is archived or deleted."""

    message = "This module is not active."
    code = "MODULE_NOT_ACTIVE"


class LessonNotActiveError(ConflictError):
    """Raised when adding or using content under a lesson that is archived or deleted."""

    message = "This lesson is not active."
    code = "LESSON_NOT_ACTIVE"


class InvalidReorderError(DomainValidationError):
    """Raised when a reorder list is not exactly the parent's active children, each once."""

    message = "The order must list every active item exactly once."
    code = "INVALID_ORDER"


# ================ Cohort Content Error ================

class ContentAlreadyAssignedError(AlreadyExistsError):
    """Raised when assigning a content that is already assigned to the cohort."""

    message = "This content is already assigned to the cohort."
    code = "CONTENT_ALREADY_ASSIGNED"


class ContentNotAssignedError(NotFoundError):
    """Raised when unassigning a content that is not assigned to the cohort."""

    message = "This content is not assigned to the cohort."
    code = "CONTENT_NOT_ASSIGNED"


# ================ Content Progress Error ================

class InactiveContentError(DomainValidationError):
    """Raised when accessing a content that is not active."""

    message = "Content is inactive."
    code = "INACTIVE_CONTENT_ERROR"


class ContentProgressAlreadyExistsError(AlreadyExistsError):
    """Raised when creating a content progress for a learner that already exists."""

    message = "Learner already has record for this content."
    code = "CONTENT_PROGRESS_ALREADY_EXISTS"


class ContentProgressNotFoundError(NotFoundError):
    """Raised when trying to access a learner content progress that does not exists."""

    message = "Learner doesn't have a record with this content."
    code = "CONTENT_PROGRESS_NOT_FOUND"


# ================ EEG Sessions Error ================

class EEGSessionTypeAlreadyExists(AlreadyExistsError):
    """Raised when trying to store a eeg session with a type that already exists for that learner."""

    message = "EEG session type arleady exists."
    code = "EEG_SESSION_TYPE_ALREADY_EXISTS"


# ================ Storage Service Error ================

class StorageServiceFileNotFoundError(NotFoundError):
    """Raised when a file does not exists in the storage service."""

    message = "File not found."
    code = "STORAGE_SERVICE_FILE_NOT_FOUND"
