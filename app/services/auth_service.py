from fastapi import HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.database.repositories.users import (
    DatabaseOperationError,
    UserAlreadyExistsError,
    create_user,
    extract_user_id,
    get_table_and_id_field,
    get_user_by_username,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


def register_user(payload: RegisterRequest) -> TokenResponse:
    """Register a new user account and return an authentication token."""
    hashed_pwd = hash_password(payload.password)
    _, id_field = get_table_and_id_field(payload.role)

    try:
        user_record = create_user(
            role=payload.role,
            username=payload.username,
            hashed_password=hashed_pwd,
            name=payload.name
        )
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken"
        ) from e
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account creation service temporarily unavailable"
        ) from e

    user_id = extract_user_id(user_record, id_field)
    token = create_access_token(subject=user_id, role=payload.role)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            username=user_record.get("username", payload.username),
            name=user_record.get("name", payload.name),
            role=payload.role
        )
    )


def authenticate_user(payload: LoginRequest) -> TokenResponse:
    """Validate user credentials and return an authentication token."""
    _, id_field = get_table_and_id_field(payload.role)

    try:
        user_record = get_user_by_username(payload.role, payload.username)
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable"
        ) from e

    # Safely verify user existence and matching password (no IndexError)
    if not user_record or not verify_password(
        payload.password,
        user_record.get("password", "")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = extract_user_id(user_record, id_field)
    token = create_access_token(subject=user_id, role=payload.role)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            username=user_record.get("username", payload.username),
            name=user_record.get("name", ""),
            role=payload.role
        )
    )
