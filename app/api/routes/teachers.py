from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.api.deps import get_current_teacher
from app.schemas.student import TeacherProfile


router = APIRouter(
    prefix="/api/v1/teachers",
    tags=["teachers"]
)



@router.get(
    "/me",
    response_model=TeacherProfile,
    summary="Get current teacher profile"
)
def get_teacher_profile(
    current_teacher: Dict[str, Any] = Depends(get_current_teacher)
) -> TeacherProfile:
    """Retrieve profile data for the authenticated teacher."""
    return TeacherProfile(
        teacher_id=current_teacher.get("teacher_id") or current_teacher.get("id"),
        username=current_teacher.get("username", ""),
        name=current_teacher.get("name", "")
    )
