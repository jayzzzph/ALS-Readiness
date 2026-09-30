# This script is for creating an admin account.
# Run 'uv run python -m backend.scripts.seed_admin'.
# Credentials should be printed in the terminal.

import asyncio
import sys

from sqlalchemy.ext.asyncio import AsyncSession

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.enums.user import UserRole
from app.models.user import User
from app.repositories.user import UserRepository

from .seed_profile import create_profile
from .seed_user import create_user


async def create_admin(session: AsyncSession, super_admin: bool = True) -> User:
    # The seeded admin is the founding super admin by default; it is created
    # already active, so it never needs another super admin's approval.
    user = await create_user(UserRole.ADMIN, session)
    # GET /users/me requires a profile, so an admin without one can't log in.
    _ = await create_profile(user.id, {"first_name": "System", "last_name": "Administrator"}, session)

    if not super_admin:
        return user

    return await UserRepository(session).update(user, {"is_super_admin": True})


async def main() -> None:
    async with AsyncSessionLocal() as session, session.begin():
        await create_admin(session)


if __name__ == "__main__":
    asyncio.run(main())
