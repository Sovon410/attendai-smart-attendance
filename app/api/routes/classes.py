from typing import Any, Dict, List

from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_student, get_current_teacher, get_current_user
from app.schemas.class_ import ClassCreate, ClassResponse, EnrollRequest, EnrollmentResponse, StudentEnrolledOut
from app.services.class_service import create_new_class, enroll_student, get_class_roster, get_user_classes


router = APIRouter(
    prefix="/api/v1/classes",
    tags=["classes"]
)



@router.post(
    "/",
    response_model=ClassResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new class (Teacher only)"
)
def create_class(
    payload: ClassCreate,
    current_teacher: Dict[str, Any] = Depends(get_current_teacher)
) -> ClassResponse:
    """Create a classroom and generate a unique join code."""
    teacher_id = current_teacher.get("_id")
    return create_new_class(teacher_id, payload)


@router.get(
    "/",
    response_model=List[ClassResponse],
    summary="List classes for current user"
)
def list_classes(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[ClassResponse]:
    """List taught classes for teachers, or enrolled classes for students."""
    return get_user_classes(current_user)


@router.post(
    "/join",
    response_model=EnrollmentResponse,
    summary="Join a class with a join code (Student only)"
)
def join_class(
    payload: EnrollRequest,
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> EnrollmentResponse:
    """Join a classroom using the 6-character code provided by the teacher."""
    student_id = current_student.get("_id")
    return enroll_student(student_id, payload)


@router.get(
    "/{class_id}/students",
    response_model=List[StudentEnrolledOut],
    summary="List students enrolled in class (Teacher only)"
)
def get_enrolled_roster(
    class_id: int,
    current_teacher: Dict[str, Any] = Depends(get_current_teacher)
) -> List[StudentEnrolledOut]:
    """Retrieve all students currently enrolled in the specified class."""
    teacher_id = current_teacher.get("_id")
    return get_class_roster(class_id, teacher_id)
