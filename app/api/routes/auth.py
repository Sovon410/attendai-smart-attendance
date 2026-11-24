from fastapi import APIRouter, status

from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import authenticate_user, register_user

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["authentication"]
)



@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student or teacher account."
)
def register(payload: RegisterRequest) -> TokenResponse:
    """Register a new student or teacher account."""
    return register_user(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT token"
)
def login(payload: LoginRequest) -> TokenResponse:
    """Authenticate with username, password, and role to get a Bearer access token."""
    return authenticate_user(payload)