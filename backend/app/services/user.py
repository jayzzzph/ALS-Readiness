from datetime import datetime, timezone

from app.core.exceptions import (
    InactiveUserError,
    UserNotFoundError,
)
from app.core.security import generate_temp_password, hash_password
from app.enums.user import UserRole
from app.models.user import User
from app.models.user_profile import UserProfile
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
                is_active=user_create.is_active,
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

    async def list_with_profiles(
        self,
        page: int,
        page_size: int,
        role: UserRole | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[tuple[User, UserProfile | None, int | None, int | None]], int]:
        return await self._user_repository.list_with_profiles(
            page=page,
            page_size=page_size,
            role=role,
            is_active=is_active,
            search=search,
        )

    async def update_password(
        self,
        user: User,
        user_update: UserPasswordUpdate,
        must_change_password: bool | None = None,
    ) -> User:
        fields = {"password_hash": hash_password(user_update.password)}

        # None leaves the flag as it is.
        if must_change_password is not None:
            fields["must_change_password"] = must_change_password

        return await self._user_repository.update(user, fields)

    async def deactivate(self, user: User) -> User:
        return await self._user_repository.update(user, {"is_active": False})

    async def activate(self, user: User) -> User:
            return await self._user_repository.update(user, {"is_active": True})
    

    # ================ Private Methods ================

    @staticmethod
    def _generate_id_no(user_id: int) -> str:
        year = datetime.now(timezone.utc).year
        return f"{year}-{user_id:05d}"    
