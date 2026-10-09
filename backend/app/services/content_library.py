from sqlalchemy import Row, and_

from app.core.exceptions import (
    ContentEditDeniedError,
    ContentNotFoundError,
    StorageUnavailableError,
)
from app.enums.content import ContentStatus, ContentType
from app.models.content import Content
from app.models.user import User
from app.repositories.content import ContentLibraryFilters, ContentRepository
from app.schemas.facilitator_content import (
    ContentEvaluationSummary,
    ContentLibraryCounts,
    ContentLibraryDetailResponse,
    ContentLibraryItem,
    ContentLibraryListResponse,
    ContentUpdate,
)
from app.services.facilitator_scope import ContentAccess, FacilitatorScopeService
from app.services.lesson import LessonService
from app.storage import STORAGE_ERRORS, get_read_url


class ContentLibraryService:
    """The facilitator's content library: what they can see, and editing of
    what they uploaded. Who sees what is decided by FacilitatorScopeService."""

    def __init__(
        self,
        content_repo: ContentRepository,
        lesson_service: LessonService,
        facilitator_scope_service: FacilitatorScopeService,
    ):
        self._content_repo = content_repo
        self._lesson_service = lesson_service
        self._facilitator_scope_service = facilitator_scope_service

    async def get_list(
        self,
        user: User,
        *,
        status: ContentStatus,
        mine: bool,
        strand_id: int | None,
        module_id: int | None,
        lesson_id: int | None,
        type: ContentType | None,
        evaluated: bool | None,
        search: str | None,
        page: int,
        page_size: int,
    ) -> ContentLibraryListResponse:
        access = await self._facilitator_scope_service.get_content_access(user)
        visible = access.visible_clause()

        # Archived content is listed only for its uploader.
        own_only = mine or status == ContentStatus.ARCHIVED
        scope = and_(visible, access.own_clause()) if own_only else visible

        filters = ContentLibraryFilters(
            status=status,
            strand_id=strand_id,
            module_id=module_id,
            lesson_id=lesson_id,
            type=type,
            evaluated=evaluated,
            search=search.strip() if search else None,
        )

        rows = await self._content_repo.get_library_page(
            scope, filters, offset=(page - 1) * page_size, limit=page_size
        )
        total = await self._content_repo.count_library(scope, filters)
        visible_total, visible_evaluated = await self._content_repo.get_library_counts(visible)

        return ContentLibraryListResponse(
            items=[self._to_item(row, access) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
            counts=ContentLibraryCounts(
                total=visible_total,
                evaluated=visible_evaluated,
                not_evaluated=visible_total - visible_evaluated,
            ),
        )

    async def get_detail(self, user: User, content_id: int) -> ContentLibraryDetailResponse:
        access = await self._facilitator_scope_service.get_content_access(user)
        row = await self._get_visible_row(access, content_id)

        # A storage failure costs the link, not the whole view. Storage that
        # is not configured counts as one.
        try:
            read_url = get_read_url(row[0].file_key)
        except (*STORAGE_ERRORS, StorageUnavailableError):
            read_url = None

        item = self._to_item(row, access)
        return ContentLibraryDetailResponse(**item.model_dump(), read_url=read_url)

    async def update(
        self,
        user: User,
        content_id: int,
        content_update: ContentUpdate,
    ) -> ContentLibraryItem:
        access = await self._facilitator_scope_service.get_content_access(user)
        content = (await self._get_visible_row(access, content_id))[0]
        self._ensure_own(access, content)

        fields = content_update.model_dump(exclude_unset=True)
        moving = "lesson_id" in fields and fields["lesson_id"] != content.lesson_id
        restoring = (
            fields.get("status") == ContentStatus.ACTIVE
            and content.status != ContentStatus.ACTIVE
        )
        # Content can only be moved to, or restored in, an active lesson under
        # an active module and strand. A restore is checked against the lesson
        # it will end up in. Archiving, and editing an archived item's other
        # fields, are never refused.
        if moving or restoring:
            await self._lesson_service.get_active_by_id(
                fields.get("lesson_id", content.lesson_id)
            )

        # Archiving leaves the cohort assignments in place; the item just stops
        # appearing in trees until it is restored.
        await self._content_repo.update(content, fields)

        row = await self._content_repo.get_library_row(content_id)
        return self._to_item(row, access)

    async def get_visible(self, user: User, content_id: int) -> Content:
        """The content if the caller can see it, else the library's 404."""
        access = await self._facilitator_scope_service.get_content_access(user)
        return (await self._get_visible_row(access, content_id))[0]

    async def get_editable(self, user: User, content_id: int) -> Content:
        """The content if the caller uploaded it. The library's 404 when they
        cannot see it; 403 when they can see it but did not upload it."""
        access = await self._facilitator_scope_service.get_content_access(user)
        content = (await self._get_visible_row(access, content_id))[0]
        self._ensure_own(access, content)

        return content

    @staticmethod
    def _ensure_own(access: ContentAccess, content: Content) -> None:
        # Seeing an item does not allow editing it. Content with no uploader
        # has no owner here, so only an admin could change it (D20).
        if not access.is_own(content):
            raise ContentEditDeniedError()

    async def _get_visible_row(self, access: ContentAccess, content_id: int) -> Row:
        """The library row, or the same 404 whether the content is missing,
        deleted, hidden from the caller, or someone else's archived item."""
        row = await self._content_repo.get_library_row(content_id)
        if row is None:
            raise ContentNotFoundError()

        content = row[0]
        if content.status == ContentStatus.ACTIVE:
            allowed = access.can_see(content)
        elif content.status == ContentStatus.ARCHIVED:
            allowed = access.is_own(content)
        else:
            allowed = False

        if not allowed:
            raise ContentNotFoundError()

        return row

    @staticmethod
    def _to_item(row: Row, access: ContentAccess) -> ContentLibraryItem:
        (
            content,
            lesson_title,
            module_title,
            strand_code,
            uploader_user_id,
            first_name,
            last_name,
            evaluation,
        ) = row

        return ContentLibraryItem(
            id=content.id,
            title=content.title,
            description=content.description,
            type=content.type,
            visibility=content.visibility,
            status=content.status,
            lesson_id=content.lesson_id,
            lesson_title=lesson_title,
            module_title=module_title,
            strand_code=strand_code,
            uploaded_by=uploader_user_id,
            uploader_name=f"{first_name} {last_name}" if first_name is not None else None,
            uploaded_at=content.uploaded_at,
            is_own=access.is_own(content),
            evaluation=(
                ContentEvaluationSummary(
                    stimulus_level=evaluation.stimulus_level,
                    cognitive_sustainability_rating=evaluation.cognitive_sustainability_rating,
                )
                if evaluation is not None
                else None
            ),
        )
