from datetime import datetime, timezone

from app.core.exceptions import (
    InactiveUserError,
    UserNotFoundError,
)
from app.core.security import generate_temp_password, hash_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserPasswordUpdate


class UserService:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    # ================ Public Methods ================

    async def create(self, user_create: UserCreate) -> tuple[User, str]:
        generated_password = generate_temp_password()

        user = await self._user_repository.create(
            User(
                password_hash=hash_password(generated_password),
                role=user_create.role,
            )
        )

        id_no = self._generate_id_no(user.id)
        user = await self._user_repository.update(user, {"id_no": id_no})

        return user, generated_password

    async def get_by_id(self, user_id: int) -> User:
        user = await self._user_repository.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError()
        
        return user

    async def get_active_by_id(self, user_id: int) -> User:
        user = await self.get_by_id(user_id)

        if not user.is_active:
            raise InactiveUserError()
        
        return user

    async def get_by_id_no(self, id_no: str) -> User:
        user = await self._user_repository.get_by_id_no(id_no)

        if user is None:
            raise UserNotFoundError()
        
        return user

    async def get_active_by_id_no(self, id_no: str) -> User:
        user = await self.get_by_id_no(id_no)

        if not user.is_active:
            raise InactiveUserError()

        return user

    async def update_password(self, user: User, user_update: UserPasswordUpdate) -> User:
        hashed_password = hash_password(user_update.password)

        return await self._user_repository.update(user, {"password_hash": hashed_password})

    async def deactivate(self, user: User) -> User:
        return await self._user_repository.update(user, {"is_active": False})

    async def activate(self, user: User) -> User:
            return await self._user_repository.update(user, {"is_active": True})
    

    # ================ Private Methods ================

    @staticmethod
    def _generate_id_no(user_id: int) -> str:
        year = datetime.now(timezone.utc).year
        return f"{year}-{user_id:05d}"    
