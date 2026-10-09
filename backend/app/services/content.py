from fastapi import HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import (
    ContentEvaluationAlreadyExistsError,
    ContentFileKeyAlreadyUsedError,
    ContentFileNotFoundError,
    ContentNotFoundError,
    InactiveContentError,
    InvalidContentFileError,
    StorageUnavailableError,
)
from app.enums.content import ContentStatus, ContentType, StimulusLevel
from app.models.content import Content
from app.models.content_evaluation import ContentEvaluation
from app.models.user import User
from app.repositories.content import ContentRepository
from app.repositories.content_evaluation import ContentEvaluationRepository
from app.schemas.content import ContentCreate
from app.services.content_library import ContentLibraryService
from app.services.facilitator import FacilitatorService
from app.services.lesson import LessonService
from app.storage import STORAGE_ERRORS, build_key, file_exists, get_upload_url


class ContentService:
    # The folder every content upload goes to. The upload URL is issued for a
    # key inside it, and a content record is only ever made from such a key.
    UPLOAD_FOLDER = "learning-contents"

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
        content_library_service: ContentLibraryService,
    ):
        self._content_repo = content_repo
        self._content_eval_repo = content_eval_repo
        self._lesson_service = lesson_service
        self._facilitator_service = facilitator_service
        self._content_library_service = content_library_service

    def _validate_extension(self, filename: str) -> None:
        if "." not in filename:
            raise InvalidContentFileError("Filename must include an extension")
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise InvalidContentFileError(f"Unsupported file extension: .{ext}")

    def _derive_content_type(self, file_key: str) -> ContentType:
        if "." not in file_key:
            raise InvalidContentFileError("File key has no extension")

        ext = file_key.rsplit(".", 1)[-1].lower()
        if ext in {"mp4", "mov", "webm"}:
            return ContentType.VIDEO
        if ext in {"mp3", "wav", "m4a"}:
            return ContentType.AUDIO
        if ext in {"pdf", "txt", "docx"}:
            return ContentType.READING

        raise InvalidContentFileError(f"Unsupported file extension: .{ext}")

    def create_upload_url(self, filename: str) -> tuple[str, str]:
        self._validate_extension(filename)
        key = build_key(self.UPLOAD_FOLDER, filename)

        ext = filename.split(".")[-1].lower()
        try:
            match self._derive_content_type(filename):
                case ContentType.VIDEO:
                    print(f"video/{ext}")
                    upload_url = get_upload_url(key, f"video/{ext}")
                case ContentType.AUDIO:
                    print(f"audio/{ext}")
                    upload_url = get_upload_url(key, f"audio/{ext}")
                case ContentType.READING:
                    print(f"text/{ext}")
                    upload_url = get_upload_url(key, f"text/{ext}")
                case _:
                    raise HTTPException(422, "Invalid content type.")
        except STORAGE_ERRORS:
            raise StorageUnavailableError() from None

        return key, upload_url

    async def create_content(
        self,
        user_id: int,
        content_create: ContentCreate,
    ) -> Content:
        facilitator = await self._facilitator_service.get_by_user_id(user_id)
        await self._lesson_service.get_active_by_id(content_create.lesson_id)

        # A key outside the upload folder is answered exactly like a file that
        # does not exist, and storage is not asked about it, so the response
        # says nothing about what else is in the bucket.
        if not content_create.file_key.startswith(f"{self.UPLOAD_FOLDER}/"):
            raise ContentFileNotFoundError()

        # One content per uploaded file. This is a check, not a constraint:
        # two requests at the same moment could both pass it.
        if await self._content_repo.exists_by_file_key(content_create.file_key):
            raise ContentFileKeyAlreadyUsedError()

        try:
            exists = file_exists(content_create.file_key)
        except STORAGE_ERRORS:
            raise StorageUnavailableError() from None

        if not exists:
            raise ContentFileNotFoundError()

        content_type = self._derive_content_type(content_create.file_key)

        content = Content(
            **content_create.model_dump(),
            type=content_type,
            status=ContentStatus.ACTIVE,
            uploaded_by=facilitator.id,
        )

        return await self._content_repo.create(content)

    async def evaluate_content(
        self,
        user: User,
        content_id: int,
        file: UploadFile,
    ) -> tuple[StimulusLevel, float]:
        # The content must exist and be visible to the caller, as in the library.
        await self._content_library_service.get_visible(user, content_id)

        # Placeholder pending the TRIBE decision: the file is not read or
        # evaluated, and every call returns the same fixed result.
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
        user: User,
        content_id: int,
        stimulus_level: StimulusLevel,
        cognitive_sustainability_rating: float,
    ) -> ContentEvaluation:
        # Only the uploader may save an evaluation: 404 if the caller cannot
        # see the content, 403 if they can see it but did not upload it.
        content = await self._content_library_service.get_editable(user, content_id)

        # The unique constraint is the backstop; this check is what makes the
        # failure a clean 409.
        if await self._content_eval_repo.get_by_content_id(content.id) is not None:
            raise ContentEvaluationAlreadyExistsError()

        content_eval = ContentEvaluation(
            content_id=content.id,
            stimulus_level=stimulus_level,
            cognitive_sustainability_rating=cognitive_sustainability_rating,
        )

        try:
            return await self._content_eval_repo.create(content_eval)
        except IntegrityError:
            # A concurrent save got past the check above.
            raise ContentEvaluationAlreadyExistsError() from None
