from typing import Any, Literal
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    role: Literal["teacher", "student"]
    username: str = Field(
        min_length=3,
        max_length=64,
        description="Unique username"
    )
    password: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )
    name: str = Field(
        min_length=1,
        max_length=120,
        description="Full name"
    )

class LoginRequest(BaseModel):
    role: Literal["teacher", "student"]
    username: str = Field(
        min_length=3,
        max_length=64,
    )
    password: str = Field(
        min_length=8,
        max_length=128
    )

class UserResponse(BaseModel):
    id: Any
    username: str
    name: str
    role: Literal["teacher", "student"]

class  TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse