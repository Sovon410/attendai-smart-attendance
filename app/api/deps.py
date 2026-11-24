from typing import Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.security import decode_access_token
from app.database.repositories.users import extract_user_id, get_table_and_id_field, get_user_by_id


security_scheme = HTTPBearer(auto_error=False)



def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)
) -> Dict[str, Any]:
    """Validate Bearer JWT token and fetch authenticated user from database."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate" : "Bearer"}
        )
    
    token = credentials.credentials
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload invalid",
                headers={"WWW-Authenticate" : "Bearer"}
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate" : "Bearer"}
        ) from e
    
    user = get_user_by_id(role, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate" : "Bearer"}
        )
    
    _, id_field = get_table_and_id_field(role)
    user["_id"] = extract_user_id(user, id_field)
    user["_role"] = role
    return user


def get_current_teacher(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Ensure the authenticated user is a teacher."""
    if user.get("_role") != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to teachers only."
        )
    return user


def get_current_student(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Ensure the authenticated user is a student."""
    if user.get("_role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to students only."
        )
    return user