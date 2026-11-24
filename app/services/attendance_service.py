from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from app.database.repositories.attendance import (
    get_attendance_for_class,
    get_attendance_for_student,
    record_attendance
)
from app.database.repositories.classes import get_class_by_id, is_student_enrolled
from app.database.repositories.users import DatabaseOperationError, get_user_by_id
from app.schemas.attendance import AttendanceRecordOut, AttendanceSummary, ManualAttendanceRequest


def manual_mark_student_attendance(
    teacher_id: Any,
    payload: ManualAttendanceRequest
) -> AttendanceRecordOut:
    """Allow a teacher to manually record or override student attendance."""
    # Verify class ownership.
    target_class = get_class_by_id(payload.class_id)
    if not target_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found."
        )
        
    if str(target_class.get("teacher_id")) != str(teacher_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to mark attendance for this class."
        )
    
    # Verify enrollment.
    if not is_student_enrolled(
        payload.class_id,
        payload.student_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not enrolled in this class."
        )
    
    target_date = str(payload.attendance_date or payload.attendance_daate) if (payload.attendance_date or payload.attendance_daate) else str(date.today())
    
    try:
        rec = record_attendance(
            class_id=payload.class_id,
            student_id=payload.student_id,
            method="manual",
            status=payload.status,
            confidence=1.0,
            date_str=target_date
        )
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Attendance recording failed: {e}"
        ) from e
    
    student_record = get_user_by_id("student", payload.student_id)
    student_name = student_record.get("name") if student_record else None

    return AttendanceRecordOut(
        attendance_id=rec.get("attendance_id"),
        class_id=rec.get("class_id"),
        student_id=rec.get("student_id"),
        student_name=student_name,
        date=str(rec.get("date", target_date)),
        status=rec.get("status", payload.status),
        method="manual",
        confidence=1.0,
        marked_at=str(rec.get("marked_at", ""))
    )


def get_user_attendance_history(
    user: Dict[str, Any],
    class_id: Optional[int] = None,
    date_str: Optional[str] = None
) -> List[AttendanceRecordOut]:
    """Retrives attendance history according to the user's role."""
    role = user.get("_role")
    user_id = user.get("_id")
    
    if role == "teacher":
        if not class_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="class_id query parameter is required for teachers."
            )
        target_class = get_class_by_id(class_id)
        if not target_class or str(target_class.get("teacher_id")) != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to attendance records for this class."
            )
        records = get_attendance_for_class(class_id, date_str=date_str)
    else:
        records = get_attendance_for_student(user_id, class_id, date_str=date_str)
    
    return [
        AttendanceRecordOut(
            attendance_id=r.get("attendance_id"),
            class_id=r.get("class_id"),
            student_id=r.get("student_id"),
            student_name=r.get("student_name"),
            date=r.get("date", ""),
            status=r.get("status", "present"),
            method=r.get("method", "manual"),
            confidence=r.get("confidence"),
            marked_at=r.get("marked_at", "")
        )
        for r in records
    ]


def get_student_attendance_summary(
    student_id: Any,
    class_id: Optional[int] = None
) -> AttendanceSummary:
    """Compute overall attendance statistics and percentage for a student."""
    records = get_attendance_for_student(student_id, class_id)
    total = len(records)
    present = sum(1 for r in records if str(r.get("status", "")).strip().lower() == "present")
    absent = sum(1 for r in records if str(r.get("status", "")).strip().lower() == "absent")
    late = sum(1 for r in records if str(r.get("status", "")).strip().lower() == "late")
    
    percentage = round(((present + (late * 0.5)) / total * 100), 2) if total > 0 else 100.0
    
    return AttendanceSummary(
        total_records=total,
        present_count=present,
        absent_count=absent,
        late_count=late,
        attendance_percentage=percentage,
        total_sessions=total,
        attendance_rate=percentage
    )
    