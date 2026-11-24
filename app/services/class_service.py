import random 
import string
from typing import Any, Dict, List

from fastapi import HTTPException, status
from app.database.repositories.classes import (
    create_class,
    enroll_student_in_class,
    get_class_by_code,
    get_class_by_id,
    is_student_enrolled,
    list_classes_by_student,
    list_classes_by_teacher,
    list_enrolled_student
)
from app.database.repositories.users import DatabaseOperationError
from app.schemas.class_ import ClassCreate, ClassResponse, EnrollRequest, EnrollmentResponse, StudentEnrolledOut


def generate_join_code(length: int = 6) -> str:
    """Generate a clean, unambiguous uppercase alphanumeric join code."""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(chars, k=length))


def create_new_class(
    teacher_id: Any,
    payload: ClassCreate
) -> ClassResponse:
    """Create a new class with a unique join code."""
    # Attempt code generation with collision retry.
    for _ in range(5):
        code = generate_join_code()
        existing = get_class_by_code(code)
        if not existing:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique join code. Please try again."
        )
    
    try:
        new_class = create_class(
            teacher_id=teacher_id,
            class_name=payload.class_name,
            class_code=code
        )
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Class creation service unavailable: {e}"
        ) from e
    
    return ClassResponse(
        class_id=new_class.get("class_id"),
        class_name=new_class.get("class_name", payload.class_name),
        class_code=new_class.get("class_code", code),
        teacher_id=new_class.get("teacher_id", teacher_id)
    )


def enroll_student(
    student_id: Any,
    payload: EnrollRequest
) -> EnrollmentResponse:
    """Validate class code and enroll student into the class."""
    
    target_class = get_class_by_code(payload.class_code)
    if not target_class:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail=f"Class with code '{payload.class_code}' was not found."
        )
    class_id = target_class.get("class_id")
    if is_student_enrolled(
        class_id,
        student_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already in the class."
        )
    
    try:
        enroll_student_in_class(class_id, student_id)
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Enrollment service unavailable: {e}"
        ) from e
    
    return EnrollmentResponse(
        class_id=class_id,
        class_name=target_class.get("class_name", ""),
        message="Successfully enrolled into class."
    )


def get_user_classes(user: Dict[str, Any]) -> List[ClassResponse]:
    """Return all classes relevant to the user's role."""
    role = user.get("_role")
    user_id = user.get("_id")
    
    if role == "teacher":
        classes = list_classes_by_teacher(user_id)
    else:
        classes = list_classes_by_student(user_id)
    
    return [
        ClassResponse(
            class_id=c.get("class_id"),
            class_name=c.get("class_name",""),
            class_code=c.get("class_code",""),
            teacher_id=c.get("teacher_id")
        )
        for c in classes
    ]


def get_class_roster(
    class_id: Any,
    teacher_id: Any
) -> List[StudentEnrolledOut]:
    """Fetch all student enrolled in a teacher's class."""
    target_class = get_class_by_id(class_id)
    if not target_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found."
        )
    
    if str(target_class.get("teacher_id")) != str(teacher_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view the roster for this class."
        )
    roster = list_enrolled_student(class_id)
    
    return [
        StudentEnrolledOut(
            student_id=s.get("student_id"),
            name=s.get("name", ""),
            username=s.get("username", ""),
            has_face_registered=s.get("has_face_registered", False),
            has_voice_registered=s.get("has_voice_registered", False)
        )
        for s in roster
    ]
