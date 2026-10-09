from app.models.eeg_session import EEGSession

from .base import BaseRepository


class EEGSessionRepository(BaseRepository[EEGSession]):
    model = EEGSession
