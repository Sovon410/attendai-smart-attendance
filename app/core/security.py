from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hash_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hash_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def create_access_token(
    subject: str | int,
    role: str,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_minutes)
    
    payload: Dict[str, Any] = {
        "sub" : str(subject),
        "role" : role,
        "iat" : int(now.timestamp()),
        "exp" : expire
    }
    
    if extra_claims:
        payload.update(extra_claims)
    
    return jwt.encode(
        payload,
        settings.jwt_secret,
        settings.jwt_algorithm
    )


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT acces token."""
    return jwt.decode(
        token,
        settings.jwt_secret,
        settings.jwt_algorithm
    )