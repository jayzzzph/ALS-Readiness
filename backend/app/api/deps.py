from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    InvalidAccessTokenError,
    MustChangePasswordError,
    UnauthorizedError,
)
from app.core.jwt import decode_access_token
from app.db.session import get_session
from app.enums.user import UserRole
from app.models.user import User
from app.repositories.cohort import CohortRepository
from app.repositories.cohort_content import CohortContentRepository
from app.repositories.cohort_facilitator import CohortFacilitatorRepository
from app.repositories.cohort_learner import CohortLearnerRepository
from app.repositories.content import ContentRepository
from app.repositories.content_evaluation import ContentEvaluationRepository
from app.repositories.curriculum import CurriculumRepository
from app.repositories.facilitator import FacilitatorRepository
from app.repositories.learner import LearnerRepository
from app.repositories.learner_content_progress import LearnerContentProgressRepository
from app.repositories.learning_strand import LearningStrandRepository
from app.repositories.lesson import LessonRepository
from app.repositories.lri_test import LRITestRepository
from app.repositories.lri_test_attempt import LRITestAttemptRepository
from app.repositories.lri_test_attempt_answer import LRITestAttemptAnswerRepository
from app.repositories.participant_intake import ParticipantIntakeRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.strand_test import StrandTestRepository
from app.repositories.strand_test_attempt import StrandTestAttemptRepository
from app.repositories.strand_test_attempt_answers import (
    StrandTestAttemptAnswerRepository,
)
from app.repositories.strand_test_item_option import StrandTestItemOptionRepository
from app.repositories.user import UserRepository
from app.repositories.user_profile import UserProfileRepository
from app.services.admin import AdminService
from app.services.auth import AuthService
from app.services.cohort import CohortService
from app.services.cohort_facilitator import CohortFacilitatorService
from app.services.cohort_learner import CohortLearnerService
from app.services.content import ContentService
from app.services.curriculum import CurriculumService
from app.services.facilitator import FacilitatorService
from app.services.learner import LearnerService
from app.services.learner_content_progress import LearnerContentProgressService
from app.services.learning_strand import LearningStrandService
from app.services.lesson import LessonService
from app.services.lri_test import LRITestService
from app.services.lri_test_attempt import LRITestAttemptService
from app.services.participant_intake import ParticipantIntakeService
from app.services.refresh_token import RefreshTokenService
from app.services.strand_test import StrandTestService
from app.services.strand_test_attempt import StrandTestAttemptService
from app.services.user import UserService
from app.services.user_profile import UserProfileService

SessionDep = Annotated[AsyncSession, Depends(get_session)]


# ================ Repositories ================


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


RefreshTokenRepositoryDep = Annotated[
    RefreshTokenRepository, Depends(get_refresh_token_repository)
]


def get_profile_repository(session: SessionDep) -> UserProfileRepository:
    return UserProfileRepository(session)


ProfileRepositoryDep = Annotated[UserProfileRepository, Depends(get_profile_repository)]


def get_participant_intake_repository(
    session: SessionDep,
) -> ParticipantIntakeRepository:
    return ParticipantIntakeRepository(session)


ParticipantIntakeRepositoryDep = Annotated[
    ParticipantIntakeRepository, Depends(get_participant_intake_repository)
]


def get_learner_repository(session: SessionDep) -> LearnerRepository:
    return LearnerRepository(session)


LearnerRepositoryDep = Annotated[LearnerRepository, Depends(get_learner_repository)]


def get_facilitator_repository(session: SessionDep) -> FacilitatorRepository:
    return FacilitatorRepository(session)


FacilitatorRepositoryDep = Annotated[
    FacilitatorRepository, Depends(get_facilitator_repository)
]

# ================== Services ==================


def get_user_service(user_repository: UserRepositoryDep) -> UserService:
    return UserService(
        user_repository=user_repository,
    )


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


def get_refresh_token_service(
    refresh_token_repository: RefreshTokenRepositoryDep,
    user_service: UserServiceDep,
) -> RefreshTokenService:
    return RefreshTokenService(
        refresh_token_repository=refresh_token_repository,
        user_service=user_service,
    )


RefreshTokenServiceDep = Annotated[
    RefreshTokenService, Depends(get_refresh_token_service)
]


def get_auth_service(
    user_service: UserServiceDep,
    refresh_token_service: RefreshTokenServiceDep,
) -> AuthService:
    return AuthService(
        user_service=user_service,
        refresh_token_service=refresh_token_service,
    )


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


def get_profile_service(profile_repository: ProfileRepositoryDep) -> UserProfileService:
    return UserProfileService(profile_repository)


ProfileServiceDep = Annotated[UserProfileService, Depends(get_profile_service)]


def get_participant_intake_service(
    repository: ParticipantIntakeRepositoryDep,
) -> ParticipantIntakeService:
    return ParticipantIntakeService(repository)


ParticipantIntakeServiceDep = Annotated[
    ParticipantIntakeService, Depends(get_participant_intake_service)
]


def get_learner_service(learner_repository: LearnerRepositoryDep) -> LearnerService:
    return LearnerService(learner_repository)


LearnerServiceDep = Annotated[LearnerService, Depends(get_learner_service)]


def get_facilitator_service(
    facilitator_repository: FacilitatorRepositoryDep,
) -> FacilitatorService:
    return FacilitatorService(facilitator_repository)


FacilitatorServiceDep = Annotated[FacilitatorService, Depends(get_facilitator_service)]


def get_admin_service(
    user_service: UserServiceDep,
    profile_service: ProfileServiceDep,
    learner_service: LearnerServiceDep,
    facilitator_service: FacilitatorServiceDep,
    refresh_token_service: RefreshTokenServiceDep,
) -> AdminService:
    return AdminService(
        user_service=user_service,
        profile_service=profile_service,
        learner_service=learner_service,
        facilitator_service=facilitator_service,
        refresh_token_service=refresh_token_service,
    )


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]


# ================== Authorization ==================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user_allow_pending_change(
    token: Annotated[str, Depends(oauth2_scheme)],
    user_service: UserServiceDep,
) -> User:
    """Authenticate without enforcing must_change_password.

    Only for endpoints a user must still reach to clear the flag (reading
    their own account, changing their password). Everything else should use
    get_current_user.
    """
    payload = decode_access_token(token)

    try:
        user_id = int(payload.get("sub"))
    except (KeyError, TypeError, ValueError):
        raise InvalidAccessTokenError()

    return await user_service.get_active_by_id(user_id)


CurrentUserAllowPendingChangeDep = Annotated[
    User, Depends(get_current_user_allow_pending_change)
]


async def get_current_user(current_user: CurrentUserAllowPendingChangeDep) -> User:
    if current_user.must_change_password:
        raise MustChangePasswordError()

    return current_user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def require_admin(current_user: CurrentUserDep) -> User:
    if current_user.role != UserRole.ADMIN:
        raise UnauthorizedError()

    return current_user


RequireAdminDep = Annotated[User, Depends(require_admin)]


async def require_super_admin(current_user: CurrentUserDep) -> User:
    if current_user.role != UserRole.ADMIN or not current_user.is_super_admin:
        raise UnauthorizedError()

    return current_user


RequireSuperAdminDep = Annotated[User, Depends(require_super_admin)]


async def get_current_learner(current_user: CurrentUserDep) -> User:
    if current_user.role != UserRole.LEARNER:
        raise UnauthorizedError()

    return current_user


CurrentLearnerDep = Annotated[User, Depends(get_current_learner)]


async def get_current_facilitator(current_user: CurrentUserDep) -> User:
    if current_user.role != UserRole.FACILITATOR:
        raise UnauthorizedError()

    return current_user


CurrentFacilitatorDep = Annotated[User, Depends(get_current_facilitator)]


# ============== Strand Test Attempts ==============


def get_strand_test_repository(session: SessionDep) -> StrandTestRepository:
    return StrandTestRepository(session)


StrandTestRepositoryDep = Annotated[
    StrandTestRepository, Depends(get_strand_test_repository)
]


def get_strand_test_service(
    test_repository: StrandTestRepositoryDep,
    learner_service: LearnerServiceDep,
) -> StrandTestService:
    return StrandTestService(
        test_repository=test_repository,
        learner_service=learner_service,
    )


StrandTestServiceDep = Annotated[StrandTestService, Depends(get_strand_test_service)]


def get_strand_test_item_option_repository(
    session: SessionDep,
) -> StrandTestItemOptionRepository:
    return StrandTestItemOptionRepository(session)


StrandTestItemOptionRepositoryDep = Annotated[
    StrandTestItemOptionRepository, Depends(get_strand_test_item_option_repository)
]


def get_strand_attempt_answer_repository(
    session: SessionDep,
) -> StrandTestAttemptAnswerRepository:
    return StrandTestAttemptAnswerRepository(session)


StrandAttemptAnswerRepositoryDep = Annotated[
    StrandTestAttemptAnswerRepository, Depends(get_strand_attempt_answer_repository)
]


def get_strand_attempt_repository(session: SessionDep) -> StrandTestAttemptRepository:
    return StrandTestAttemptRepository(session)


StrandAttemptRepositoryDep = Annotated[
    StrandTestAttemptRepository, Depends(get_strand_attempt_repository)
]


def get_strand_attempt_service(
    attempt_repository: StrandAttemptRepositoryDep,
    attempt_answer_repository: StrandAttemptAnswerRepositoryDep,
    learner_service: LearnerServiceDep,
    test_option_repository: StrandTestItemOptionRepositoryDep,
    test_repository: StrandTestRepositoryDep,
) -> StrandTestAttemptService:
    return StrandTestAttemptService(
        attempt_repository=attempt_repository,
        attempt_answer_repository=attempt_answer_repository,
        learner_service=learner_service,
        test_option_repository=test_option_repository,
        test_repository=test_repository,
    )


StrandAttemptServiceDep = Annotated[
    StrandTestAttemptService, Depends(get_strand_attempt_service)
]


# ================ LRI Test ==============


def get_lri_test_repository(session: SessionDep) -> LRITestRepository:
    return LRITestRepository(session)


LRITestRepositoryDep = Annotated[LRITestRepository, Depends(get_lri_test_repository)]


def get_lri_test_service(
    test_repository: LRITestRepositoryDep, learner_service: LearnerServiceDep
) -> LRITestService:
    return LRITestService(
        test_repository=test_repository, learner_service=learner_service
    )


LRITestServiceDep = Annotated[LRITestService, Depends(get_lri_test_service)]


def get_lri_test_attempt_repository(session: SessionDep) -> LRITestAttemptRepository:
    return LRITestAttemptRepository(session)


LRITestAttemptRepositoryDep = Annotated[
    LRITestAttemptRepository, Depends(get_lri_test_attempt_repository)
]


def get_lri_test_attempt_answer_repository(
    session: SessionDep,
) -> LRITestAttemptAnswerRepository:
    return LRITestAttemptAnswerRepository(session)


LRITestAttemptAnswerRepositoryDep = Annotated[
    LRITestAttemptAnswerRepository, Depends(get_lri_test_attempt_answer_repository)
]


def get_lri_test_attempt_service(
    attempt_repository: LRITestAttemptRepositoryDep,
    answer_repository: LRITestAttemptAnswerRepositoryDep,
    learner_service: LearnerServiceDep,
    test_service: LRITestServiceDep,
) -> LRITestAttemptService:
    return LRITestAttemptService(
        attempt_repository=attempt_repository,
        answer_repository=answer_repository,
        learner_service=learner_service,
        test_service=test_service,
    )


LRITestAttemptServiceDep = Annotated[
    LRITestAttemptService, Depends(get_lri_test_attempt_service)
]


# ================ Cohorts ===============


def get_cohort_learner_repo(session: SessionDep) -> CohortLearnerRepository:
    return CohortLearnerRepository(session)


CohortLearnerRepoDep = Annotated[
    CohortLearnerRepository, Depends(get_cohort_learner_repo)
]


def get_cohort_learner_service(
    cohort_learner_repo: CohortLearnerRepoDep,
    learner_service: LearnerServiceDep,
) -> CohortLearnerService:
    return CohortLearnerService(
        cohort_learner_repo,
        learner_service,
    )


CohortLearnerServiceDep = Annotated[
    CohortLearnerService, Depends(get_cohort_learner_service)
]


def get_cohort_facilitator_repo(session: SessionDep) -> CohortFacilitatorRepository:
    return CohortFacilitatorRepository(session)


CohortFacilitatorRepoDep = Annotated[
    CohortFacilitatorRepository, Depends(get_cohort_facilitator_repo)
]


def get_cohort_facilitator_service(
    cohort_facilitator_repo: CohortFacilitatorRepoDep,
    facilitator_service: FacilitatorServiceDep,
) -> CohortFacilitatorService:
    return CohortFacilitatorService(
        cohort_facilitator_repo,
        facilitator_service,
    )


CohortFacilitatorServiceDep = Annotated[
    CohortFacilitatorService, Depends(get_cohort_facilitator_service)
]


def get_cohort_repo(session: SessionDep) -> CohortRepository:
    return CohortRepository(session)


CohortRepoDep = Annotated[CohortRepository, Depends(get_cohort_repo)]


def get_cohort_service(
    cohort_repo: CohortRepoDep,
    cohort_learner_service: CohortLearnerServiceDep,
    cohort_facilitator_service: CohortFacilitatorServiceDep,
) -> CohortService:
    return CohortService(
        cohort_repo=cohort_repo,
        cohort_learner_service=cohort_learner_service,
        cohort_facilitator_service=cohort_facilitator_service,
    )


CohortServiceDep = Annotated[CohortService, Depends(get_cohort_service)]


# ============ Lessons ============


def get_lesson_repo(session: SessionDep) -> LessonRepository:
    return LessonRepository(session)


LessonRepoDep = Annotated[LessonRepository, Depends(get_lesson_repo)]


def get_lesson_service(lesson_repo: LessonRepoDep) -> LessonService:
    return LessonService(lesson_repo)


LessonServiceDep = Annotated[LessonService, Depends(get_lesson_service)]


# ============ Contents ============

def get_content_eval_repo(session: SessionDep) -> ContentEvaluationRepository:
    return ContentEvaluationRepository(session)


ContentEvalRepoDep = Annotated[ContentEvaluationRepository, Depends(get_content_eval_repo)]



def get_content_repo(session: SessionDep) -> ContentRepository:
    return ContentRepository(session)


ContentRepoDep = Annotated[ContentRepository, Depends(get_content_repo)]


def get_content_service(
    content_repo: ContentRepoDep,
    content_eval_repo: ContentEvalRepoDep,
    lesson_service: LessonServiceDep,
    facilitator_service: FacilitatorServiceDep,
) -> ContentService:
    return ContentService(
        content_repo=content_repo,
        lesson_service=lesson_service,
        facilitator_service=facilitator_service,
        content_eval_repo=content_eval_repo,
    )


ContentServiceDep = Annotated[ContentService, Depends(get_content_service)]


def get_content_progress_repo(session: SessionDep) -> LearnerContentProgressRepository:
    return LearnerContentProgressRepository(session)


ContentProgressRepoDep = Annotated[LearnerContentProgressRepository, Depends(get_content_progress_repo)]


def get_content_progress_service(
    progress_repo: ContentProgressRepoDep,
    learner_service: LearnerServiceDep,
    content_service: ContentServiceDep,
) -> LearnerContentProgressService:
    return LearnerContentProgressService(
        progress_repo=progress_repo,
        learner_service=learner_service,
        content_service=content_service,
    )


ContentProgressServiceDep = Annotated[LearnerContentProgressService, Depends(get_content_progress_service)]


# =========== Cohort Content =============


def get_cohort_content_repo(session: SessionDep) -> CohortContentRepository:
    return CohortContentRepository(session)


CohortContentRepoDep = Annotated[
    CohortContentRepository, Depends(get_cohort_content_repo)
]


# ============ Curriculum =============


def get_curriculum_repo(session: SessionDep) -> CurriculumRepository:
    return CurriculumRepository(session)


CurriculumRepoDep = Annotated[CurriculumRepository, Depends(get_curriculum_repo)]


def get_curriculum_service(
    curriculum_repo: CurriculumRepoDep,
    learner_service: LearnerServiceDep,
    cohort_content_repo: CohortContentRepoDep,
    cohort_learner_service: CohortLearnerServiceDep,
) -> CurriculumService:
    return CurriculumService(
        curriculum_repo=curriculum_repo,
        learner_service=learner_service,
        cohort_content_repo=cohort_content_repo,
        cohort_learner_service=cohort_learner_service,
    )


CurriculumServiceDep = Annotated[CurriculumService, Depends(get_curriculum_service)]


# ============ Learning Strand ============

def get_strand_repo(session: SessionDep) -> LearningStrandRepository:
    return LearningStrandRepository(session)


StrandRepoDep = Annotated[LearningStrandRepository, Depends(get_strand_repo)]


def get_strand_service(
    strand_repo: StrandRepoDep,
    curriculum_repo: CurriculumRepoDep,
    cohort_learner_service: CohortLearnerServiceDep,
    learner_service: LearnerServiceDep,
) -> LearningStrandService:
    return LearningStrandService(
        strand_repo=strand_repo,
        curriculum_repo=curriculum_repo,
        learner_service=learner_service,
        cohort_learner_service=cohort_learner_service,
    )


StrandServiceDep = Annotated[LearningStrandService, Depends(get_strand_service)]


