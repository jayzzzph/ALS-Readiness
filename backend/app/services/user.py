from app.core.exceptions.user import (
    EmailAlreadyExistsError,
    InactiveUserError,
    UserNotFoundError,
)
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate


class UserService:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    async def create(self, user_create: UserCreate) -> User:
        existing = await self._user_repository.get_by_email(user_create.email)
        if existing:
            raise EmailAlreadyExistsError()

        hashed_password = hash_password(user_create.password)

        user = await self._user_repository.create(
            User(
                email=user_create.email,
                password_hash=hashed_password,
                role=user_create.role,
            )
        )
        return user

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
