from .facilitator import FacilitatorService
from .learner import LearnerService
from .user import UserService
from .user_profile import UserProfileService


class AdminService:
    def __init__(
        self,
        user_service: UserService,
        profile_service: UserProfileService,
        learner_service: LearnerService,
        facilitator_service: FacilitatorService,
    ):
        self._user_service = user_service
        self._profile_service = profile_service
        self._learner_service = learner_service 
        self._facilitator_service = facilitator_service 

    async def create_learner(self):
        pass

    async def create_facilitator(self):
        pass

    async def _create_base_user(self):
        pass
