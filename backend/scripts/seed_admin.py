# This script is for creating an admin account.
# Run 'uv run python -m backend.scripts.seed_admin'.
# Credentials should be printed in the terminal.

import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import AsyncSessionLocal
from app.enums.user import UserRole
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate
from app.services.user import UserService


async def create_admin():
    async with AsyncSessionLocal() as session, session.begin():
        repo = UserRepository(session)
        service = UserService(repo)

        user, temp_password = await service.create(
            UserCreate(role=UserRole.ADMIN)
        )

        print(f"Admin created - id_no: {user.id_no}, temp_password: {temp_password}")


if __name__ == "__main__":
    asyncio.run(create_admin())