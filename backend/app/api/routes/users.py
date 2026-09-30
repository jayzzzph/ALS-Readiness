from app.schemas.user import PasswordChangeRequest, UserMeResponse, UserResponse
from app.schemas.user_profile import UserProfileResponse, UserProfileUpdate
from fastapi import APIRouter, Request

from ..deps import (
    AuthServiceDep,
    CurrentUserAllowPendingChangeDep,
    CurrentUserDep,
    ProfileServiceDep,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    current_user: CurrentUserAllowPendingChangeDep,
    profile_service: ProfileServiceDep,
):
    profile = await profile_service.get_by_user_id(current_user.id)

    return UserMeResponse(
        id=current_user.id,
        id_no=current_user.id_no,
        role=current_user.role,
        is_active=current_user.is_active,
        is_super_admin=current_user.is_super_admin,
        must_change_password=current_user.must_change_password,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        profile=UserProfileResponse(
            user_id=profile.user_id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            middle_name=profile.middle_name,
            birthdate=profile.birthdate,
            gender=profile.gender,
            address=profile.address,
            contact_number=profile.contact_number,
            contact_email=profile.contact_email,
        ),
    )


@router.patch("/me", response_model=UserMeResponse)
async def update_me(
    current_user: CurrentUserDep,
    profile_update: UserProfileUpdate,
    profile_service: ProfileServiceDep,
):
    profile = await profile_service.update(current_user.id, profile_update)

    return UserMeResponse(
        id=current_user.id,
        id_no=current_user.id_no,
        role=current_user.role,
        is_active=current_user.is_active,
        is_super_admin=current_user.is_super_admin,
        must_change_password=current_user.must_change_password,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        profile=UserProfileResponse(
            user_id=profile.user_id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            middle_name=profile.middle_name,
            birthdate=profile.birthdate,
            gender=profile.gender,
            address=profile.address,
            contact_number=profile.contact_number,
            contact_email=profile.contact_email,
        ),
    )


@router.patch("/me/password", response_model=UserResponse)
async def change_my_password(
    request: Request,
    current_user: CurrentUserAllowPendingChangeDep,
    password_change: PasswordChangeRequest,
    auth_service: AuthServiceDep,
):
    current_refresh_token = request.cookies.get("refresh_token")
    user = await auth_service.change_password(
        current_user, password_change, current_refresh_token
    )
    return UserResponse.model_validate(user)
