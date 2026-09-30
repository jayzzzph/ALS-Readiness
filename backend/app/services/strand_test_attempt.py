from app.core.exceptions import (
    InvalidTestAttemptError,
    PretestRequiredError,
    StrandTestAttemptAlreadyExistsError,
    StrandTestAttemptNotFoundError,
    StrandTestItemOptionNotFoundError,
    StrandTestNotFoundError,
)
from app.enums.strand_test import StrandTestType
from app.models.strand_test_attempt import StrandTestAttempt, StrandTestAttemptAnswer
from app.repositories.strand_test import StrandTestRepository
from app.repositories.strand_test_attempt import StrandTestAttemptRepository
from app.repositories.strand_test_attempt_answers import (
    StrandTestAttemptAnswerRepository,
)
from app.repositories.strand_test_item_option import StrandTestItemOptionRepository
from app.schemas.strand_test_attempt import (
    StrandAttemptCreate,
    StrandAttemptResponse,
    StrandAttemptResultResponse,
)
from app.services.learner import LearnerService
from sqlalchemy.exc import IntegrityError


class StrandTestAttemptService:
    def __init__(
        self,
        attempt_repository: StrandTestAttemptRepository,
        attempt_answer_repository: StrandTestAttemptAnswerRepository,
        test_option_repository:  StrandTestItemOptionRepository,
        test_repository: StrandTestRepository,
        learner_service: LearnerService,
    ):
        self._attempt_repository = attempt_repository
        self._attempt_answer_repository = attempt_answer_repository
        self._learner_service = learner_service
        self._test_option_repository = test_option_repository
        self._test_repository = test_repository

    async def create(
        self,
        user_id: int,
        test_id: int,
        attempt_create: StrandAttemptCreate,
    ) -> StrandAttemptResponse:
        learner = await self._learner_service.get_by_user_id(user_id)
     
        test = await self._test_repository.get_by_id(test_id)

        if test is None:
            raise StrandTestNotFoundError()

        test_options = await self._test_option_repository.get_by_test(test_id)

        # A test with no items can't be attempted (and would make MPS undefined).
        if not test_options:
            raise StrandTestNotFoundError()

        # One attempt per learner per test. The unique constraint is the
        # backstop; this check is what makes the failure a clean 409.
        existing = await self._attempt_repository.get_by_test_and_learner(
            test_id, learner.id
        )
        if existing is not None:
            raise StrandTestAttemptAlreadyExistsError()

        # A posttest requires the learner's pretest for the same strand.
        if test.type == StrandTestType.POSTTEST:
            has_pretest = await self._attempt_repository.has_pretest_attempt(
                learner.id, test.strand_id
            )
            if not has_pretest:
                raise PretestRequiredError()

        # Turn test options into dictionaries for more efficient data access
        test_options_by_id = {
            opt.id: opt
            for opt in test_options
        }

        answers = attempt_create.answers

        # An answer is valid only when its option belongs to the supplied item,
        # and no item is answered more than once. Unanswered items are allowed:
        # the frontend auto-submits whatever is answered when a timed attempt
        # runs out, and each missing item simply scores as incorrect (item_count
        # below is always the full test, so the MPS reflects them).
        test_item_ids = {option.item_id for option in test_options}
        answer_item_ids = [answer.item_id for answer in answers]
        if (
            len(set(answer_item_ids)) != len(answer_item_ids)
            or not set(answer_item_ids) <= test_item_ids
        ):
            raise InvalidTestAttemptError(
                "Answers must reference this test's items, at most one response each."
            )

        total_score = 0

        for answer in answers:
            option = test_options_by_id.get(answer.option_id)

            if option is None or option.item_id != answer.item_id:
                raise StrandTestItemOptionNotFoundError()

            if option.is_correct:
                total_score += 1

        # Store attempt in strand_test_attempts table
        try:
            attempt = await self._attempt_repository.create(
                StrandTestAttempt(
                    test_id=test_id,
                    learner_id=learner.id,
                    total_score=total_score,
                    item_count=len(test_item_ids),
                )
            )
        except IntegrityError:
            # A concurrent submission got past the check above; the unique
            # constraint on (learner_id, test_id) rejected this one.
            raise StrandTestAttemptAlreadyExistsError() from None

        # Store each answer in strand_test_attempt_answers table
        for answer in answers:
            option = test_options_by_id.get(answer.option_id)

            await self._attempt_answer_repository.create(
                StrandTestAttemptAnswer(
                    attempt_id=attempt.id,
                    item_id=answer.item_id,
                    option_id=answer.option_id,
                    is_correct=option.is_correct
                )
            )

        return StrandAttemptResponse(attempt_id=attempt.id, status="submitted")

    async def get_result(self, user_id: int, test_id: int) -> StrandAttemptResultResponse:
        """The calling learner's own attempt for a test, with its MPS.

        The learner is always derived from the authenticated user and used as a
        filter, so another learner's attempt can never be returned.
        """
        learner = await self._learner_service.get_by_user_id(user_id)

        attempt = await self._attempt_repository.get_by_test_and_learner(
            test_id, learner.id
        )

        if attempt is None:
            raise StrandTestAttemptNotFoundError()

        # MPS is computed on read from the two stored values.
        mps = round(attempt.total_score / attempt.item_count * 100, 2)

        return StrandAttemptResultResponse(
            attempt_id=attempt.id,
            test_id=attempt.test_id,
            total_score=attempt.total_score,
            item_count=attempt.item_count,
            mps=mps,
            taken_at=attempt.taken_at,
        )

