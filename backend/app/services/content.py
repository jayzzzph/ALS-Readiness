from botocore.exceptions import ClientError
from fastapi import HTTPException

from app.core.exceptions import ContentNotFoundError, InactiveContentError
from app.enums.content import ContentStatus, ContentType, StimulusLevel
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.repositories.content import ContentRepository
from app.repositories.content_evaluation import ContentEvaluationRepository
from app.schemas.content import ContentCreate
from app.services.facilitator import FacilitatorService
from app.services.lesson import LessonService
from app.storage import build_key, file_exists, get_upload_url


class ContentService:
    ALLOWED_EXTENSIONS = {  # noqa: RUF012
        "mp4",
        "mov",
        "webm",
        "mp3",
        "wav",
        "m4a",
        "pdf",
        "txt",
        "docx",
    }

    def __init__(
        self,
        content_repo: ContentRepository,
        content_eval_repo: ContentEvaluationRepository,
        lesson_service: LessonService,
        facilitator_service: FacilitatorService,
    ):
        self._content_repo = content_repo
        self._content_eval_repo = content_eval_repo
        self._lesson_service = lesson_service
        self._facilitator_service = facilitator_service

    def _validate_extension(self, filename: str) -> None:
        if "." not in filename:
            raise HTTPException(422, "Filename must include an extension")
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(422, f"Unsupported file extension: .{ext}")

    def _derive_content_type(self, file_key: str) -> ContentType:
        if "." not in file_key:
            raise HTTPException(422, "File key has no extension")

        ext = file_key.rsplit(".", 1)[-1].lower()
        if ext in {"mp4", "mov", "webm"}:
            return ContentType.VIDEO
        if ext in {"mp3", "wav", "m4a"}:
            return ContentType.AUDIO
        if ext in {"pdf", "txt", "docx"}:
            return ContentType.READING

        raise HTTPException(422, f"Unsupported file extension: .{ext}")

    def create_upload_url(self, filename: str) -> tuple[str, str]:
        self._validate_extension(filename)

        key = build_key("learning-contents", filename)
        upload_url = get_upload_url(key)

        return key, upload_url

    async def create_content(
        self,
        user_id: int,
        content_create: ContentCreate,
    ) -> Content:
        facilitator = await self._facilitator_service.get_by_user_id(user_id)
        _ = await self._lesson_service.get_by_id(content_create.lesson_id)

        try:
            exists = file_exists(content_create.file_key)
        except ClientError:
            raise HTTPException(503, "Storage service unavailable.")

        if not exists:
            raise HTTPException(404, "File not found at the given key.")

        content_type = self._derive_content_type(content_create.file_key)

        content = Content(
            **content_create.model_dump(),
            type=content_type,
            uploaded_by=facilitator.id,
        )

        return await self._content_repo.create(content)

    async def evaluate_content(self) -> tuple[StimulusLevel, float]:
        return StimulusLevel.LOW, 0.5

    async def get_content_by_id(self, content_id: int) -> Content:
        content = await self._content_repo.get_by_id(content_id)

        if content is None:
            raise ContentNotFoundError()

        return content

    async def get_active_content_by_id(self, content_id: int) -> Content:
        content = await self.get_content_by_id(content_id)

        if content.status != ContentStatus.ACTIVE:
            raise InactiveContentError()

        return content

    async def create_content_evaluation(
        self,
        content_id: int,
        stimulus_level: StimulusLevel,
        cognitive_sustainability_rating: float,
    ) -> ContentEvaluation:
        content = await self.get_content_by_id(content_id)

        content_eval = ContentEvaluation(
            content_id=content.id,
            stimulus_level=stimulus_level,
            cognitive_sustainability_rating=cognitive_sustainability_rating,
        )

        return await self._content_eval_repo.create(content_eval)
        