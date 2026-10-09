from dataclasses import dataclass

from sqlalchemy import ColumnElement, false, or_, true

from app.core.exceptions import (
    CohortAccessDeniedError,
    CohortNotActiveError,
    CohortNotFoundError,
)
from app.enums.cohort import CohortStatus
from app.enums.content import ContentVisibility
from app.enums.user import UserRole
from app.models.cohort import Cohort
from app.models.content import Content
from app.models.user import User
from app.repositories.cohort import CohortRepository
from app.repositories.cohort_content import CohortContentRepository
from app.repositories.cohort_learner import CohortLearnerRepository
from app.repositories.facilitator import FacilitatorRepository

# A facilitator can see a cohort in any of these states. An archived cohort is
# hidden from facilitators even while their assignment to it is still active.
VISIBLE_COHORT_STATUSES = (
    CohortStatus.UPCOMING,
    CohortStatus.ACTIVE,
    CohortStatus.COMPLETED,
)


@dataclass(frozen=True)
class ContentAccess:
    """What one caller may do with content. The content rules live here only.

    A facilitator may assign a content item when any of these holds:
      1. they uploaded it;
      2. its visibility is public (D9);
      3. it has no uploader, as with seeded or legacy content (D20).
    They may see it when any of those holds, or when:
      4. it is assigned to a cohort they can see (D19).

    Rule 4 lets a facilitator see another facilitator's private item in a
    shared cohort, but not assign it elsewhere. An admin may see and assign
    everything. Status is not considered here; callers filter on it separately.
    """

    sees_all: bool = False
    facilitator_id: int | None = None
    # Ids of the content assigned to any cohort the caller can see (rule 4).
    shared_content_ids: frozenset[int] = frozenset()

    def is_own(self, content: Content) -> bool:
        return self.facilitator_id is not None and content.uploaded_by == self.facilitator_id

    def can_assign(self, content: Content) -> bool:
        if self.sees_all:
            return True
        if self.facilitator_id is None:
            return False

        return (
            self.is_own(content)
            or content.visibility == ContentVisibility.PUBLIC
            or content.uploaded_by is None
        )

    def can_see(self, content: Content) -> bool:
        if self.facilitator_id is None and not self.sees_all:
            return False

        return self.can_assign(content) or content.id in self.shared_content_ids

    # The same rules as query conditions, for listings that page in the
    # database. Keep them in step with the checks above.

    def own_clause(self) -> ColumnElement[bool]:
        if self.facilitator_id is None:
            return false()

        return Content.uploaded_by == self.facilitator_id

    def visible_clause(self) -> ColumnElement[bool]:
        if self.sees_all:
            return true()
        if self.facilitator_id is None:
            return false()

        return or_(
            self.own_clause(),
            Content.visibility == ContentVisibility.PUBLIC,
            Content.uploaded_by.is_(None),
            Content.id.in_(self.shared_content_ids),
        )


class FacilitatorScopeService:
    """Decides which cohorts and learners a caller may see, and which cohorts
    they may change.

    An admin may see everything. A facilitator may see a cohort when their
    assignment to it is active and the cohort is not archived, and may see the
    learners in those cohorts. Anyone else is denied. Changes are allowed only
    while the cohort itself is active.

    Content follows the rules in ContentAccess.
    """

    def __init__(
        self,
        cohort_repo: CohortRepository,
        cohort_learner_repo: CohortLearnerRepository,
        cohort_content_repo: CohortContentRepository,
        facilitator_repo: FacilitatorRepository,
    ):
        self._cohort_repo = cohort_repo
        self._cohort_learner_repo = cohort_learner_repo
        self._cohort_content_repo = cohort_content_repo
        self._facilitator_repo = facilitator_repo

    async def get_visible_cohorts(self, user: User) -> list[Cohort]:
        if user.role != UserRole.FACILITATOR:
            return []

        cohorts = await self._cohort_repo.get_cohort_by_facilitator_id(user.id)
        return [cohort for cohort in cohorts if cohort.status in VISIBLE_COHORT_STATUSES]

    async def get_visible_cohort_ids(self, user: User) -> list[int]:
        return [cohort.id for cohort in await self.get_visible_cohorts(user)]

    async def assert_cohort_access(self, user: User, cohort_id: int) -> None:
        if user.role == UserRole.ADMIN:
            return

        if cohort_id not in await self.get_visible_cohort_ids(user):
            raise CohortAccessDeniedError()

    async def assert_cohort_writable(self, user: User, cohort_id: int) -> None:
        await self.assert_cohort_access(user, cohort_id)

        cohort = await self._cohort_repo.get_by_id(cohort_id)
        if cohort is None:
            # Only an admin gets this far for a cohort that does not exist.
            raise CohortNotFoundError()

        if cohort.status != CohortStatus.ACTIVE:
            raise CohortNotActiveError()

    async def assert_learner_access(self, user: User, learner_id: int) -> None:
        if user.role == UserRole.ADMIN:
            return

        # Ended memberships count, so a facilitator can still view a learner
        # who completed one of the cohorts they can see.
        cohort_ids = await self.get_visible_cohort_ids(user)
        if not await self._cohort_learner_repo.exists_in_cohorts(learner_id, cohort_ids):
            raise CohortAccessDeniedError()

    async def get_content_access(self, user: User) -> ContentAccess:
        """The caller's content rules (D9, D19, D20).

        Built once per request, so a whole tree can be checked with a fixed
        number of lookups.
        """
        return await self._build_content_access(user, include_shared=True)

    async def can_see_content(self, user: User, content: Content) -> bool:
        return (await self.get_content_access(user)).can_see(content)

    async def can_assign_content(self, user: User, content: Content) -> bool:
        # Assigning does not depend on what is shared, so that lookup is skipped.
        access = await self._build_content_access(user, include_shared=False)
        return access.can_assign(content)

    async def _build_content_access(self, user: User, include_shared: bool) -> ContentAccess:
        if user.role == UserRole.ADMIN:
            return ContentAccess(sees_all=True)

        if user.role != UserRole.FACILITATOR:
            return ContentAccess()

        facilitator = await self._facilitator_repo.get_by_user_id(user.id)
        facilitator_id = facilitator.id if facilitator is not None else None

        shared_content_ids: frozenset[int] = frozenset()
        if include_shared:
            cohort_ids = await self.get_visible_cohort_ids(user)
            shared_content_ids = frozenset(
                await self._cohort_content_repo.get_content_ids_for_cohorts(cohort_ids)
            )

        return ContentAccess(
            facilitator_id=facilitator_id,
            shared_content_ids=shared_content_ids,
        )
