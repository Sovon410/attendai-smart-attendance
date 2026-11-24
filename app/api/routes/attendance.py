from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from app.api.deps import get_current_student, get_current_teacher, get_current_user
from app.schemas.attendance import (
    AttendanceRecordOut,
    AttendanceSummary,
    AttendanceVerificationResponse,
    ManualAttendanceRequest,
)
from app.services.attendance_service import (
    get_student_attendance_summary,
    get_user_attendance_history,
    manual_mark_student_attendance,
)
from app.services.recognition_service import verify_and_mark_photo, verify_and_mark_voice

router = APIRouter(prefix="/api/v1/attendance", tags=["attendance"])


@router.post(
    "/photo",
    response_model=AttendanceVerificationResponse,
    summary="Mark attendance using live face photo verification"
)
async def mark_attendance_by_photo(
    class_id: int = Form(..., description="ID of the class in session"),
    file: UploadFile = File(..., description="Live face image file (JPEG, PNG, WebP)"),
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> AttendanceVerificationResponse:
    """Verify face from uploaded live image against enrolled biometric vector and mark attendance."""
    student_id = current_student.get("_id")
    image_bytes = await file.read()
    return verify_and_mark_photo(class_id, student_id, image_bytes)


@router.post(
    "/voice",
    response_model=AttendanceVerificationResponse,
    summary="Mark attendance using live voice sample verification"
)
async def mark_attendance_by_voice(
    class_id: int = Form(..., description="ID of the class in session"),
    file: UploadFile = File(..., description="Audio clip file (WAV, MP3, M4A)"),
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> AttendanceVerificationResponse:
    """Verify voice from uploaded audio clip against enrolled voice vector and mark attendance."""
    student_id = current_student.get("_id")
    audio_bytes = await file.read()
    return verify_and_mark_voice(class_id, student_id, audio_bytes)


@router.post(
    "/manual",
    response_model=AttendanceRecordOut,
    summary="Manually mark or override student attendance (Teacher only)"
)
def manual_mark_attendance(
    payload: ManualAttendanceRequest,
    current_teacher: Dict[str, Any] = Depends(get_current_teacher)
) -> AttendanceRecordOut:
    """Allow a teacher to manually mark attendance for an enrolled student."""
    teacher_id = current_teacher.get("_id")
    return manual_mark_student_attendance(teacher_id, payload)


@router.get(
    "/history",
    response_model=List[AttendanceRecordOut],
    summary="View attendance history records"
)
def get_attendance_history(
    class_id: Optional[int] = Query(default=None, description="Filter by class ID (required for teachers)"),
    date: Optional[str] = Query(default=None, description="Filter by date (YYYY-MM-DD)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[AttendanceRecordOut]:
    """Fetch attendance logs: class attendance for teachers, or personal history for students."""
    return get_user_attendance_history(current_user, class_id=class_id, date_str=date)


@router.get(
    "/stats",
    response_model=AttendanceSummary,
    summary="View student attendance percentage summary"
)
def get_attendance_statistics(
    class_id: Optional[int] = Query(default=None, description="Optional class ID filter"),
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> AttendanceSummary:
    """Calculate attendance stats and overall attendance percentage for the current student."""
    student_id = current_student.get("_id")
    return get_student_attendance_summary(student_id, class_id=class_id)
