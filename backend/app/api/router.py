from fastapi import APIRouter

from .routes.auth import router as auth_router
from .routes.users import router as user_router

router = APIRouter(prefix="/api")

router.include_router(auth_router)
router.include_router(user_router)
