from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from app.database.client import supabase
from app.database.repositories.users import DatabaseOperationError


def has_marked_attendance_today(
    class_id: Any,
    student_id: Any,
    date_str: Optional[str] = None
) -> bool:
    """Check if attendance is already been recorded for this student and class today."""
    target_date = date_str or str(date.today())
    
    try:
        response = (
            supabase.table("attendance")
            .select("attendance_id")
            .eq("class_id", class_id)
            .eq("student_id", student_id)
            .eq("date", target_date)
            .limit(1)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise DatabaseOperationError(f"Error checking attendance duplicate: {e}") from e


def record_attendance(
    class_id: Any,
    student_id: Any,
    method: str,
    status: str = "present",
    confidence: Optional[float] = None,
    date_str: Optional[str] = None
) -> Dict[str, Any]:
    """Insert or update an attendance record."""
    target_date = date_str or str(date.today())
    
    record = {
        "class_id": class_id,
        "student_id": student_id,
        "date": target_date,
        "status": status,
        "method": method,
        "confidence": confidence
    }
    
    try:
        # Check if record already exists for this student, class, and date
        existing = (
            supabase.table("attendance")
            .select("attendance_id")
            .eq("class_id", class_id)
            .eq("student_id", student_id)
            .eq("date", target_date)
            .limit(1)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            att_id = existing.data[0]["attendance_id"]
            update_data = {
                "status": status,
                "method": method,
                "confidence": confidence,
                "marked_at": datetime.now(timezone.utc).isoformat(),
            }
            update_resp = (
                supabase.table("attendance")
                .update(update_data)
                .eq("attendance_id", att_id)
                .execute()
            )
            if update_resp.data and len(update_resp.data) > 0:
                return update_resp.data[0]

        # Otherwise insert a new record
        response = (
            supabase.table("attendance")
            .insert(record)
            .execute()
        )
        if not response.data:
            raise DatabaseOperationError("Failed to record attendance.")
        return response.data[0]
    except Exception as e:
        err = str(e).lower()
        if "23505" in err or "duplicate key" in err or "unique constraint" in err:
            try:
                # Fallback to update on race condition duplicate
                update_resp = (
                    supabase.table("attendance")
                    .update({
                        "status": status,
                        "method": method,
                        "confidence": confidence,
                        "marked_at": datetime.now(timezone.utc).isoformat(),
                    })
                    .eq("class_id", class_id)
                    .eq("student_id", student_id)
                    .eq("date", target_date)
                    .execute()
                )
                if update_resp.data and len(update_resp.data) > 0:
                    return update_resp.data[0]
            except Exception as update_err:
                raise DatabaseOperationError(f"Database error updating attendance: {update_err}") from update_err

        raise DatabaseOperationError(f"Database error recording attendance: {e}") from e


def get_attendance_for_class(
    class_id: Any,
    date_str: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetch attendance records for a class, optionally filtered by date."""
    
    try:
        query = (
            supabase.table("attendance")
            .select("attendance_id, class_id, student_id, date, status, method, confidence, marked_at, students(name)")
            .eq("class_id", class_id)
        )
        # Conditional filter vs. historical sort
        if date_str:
            query = query.eq("date", date_str)
        else:
            query = query.order("date", desc=True)
        
        response = query.execute()
        records = []
        for r in response.data or []:
            student_name = r.get("students", {}).get("name") if r.get("students") else None
            records.append(
                {
                    "attendance_id" : r.get("attendance_id"),
                    "class_id" : r.get("class_id"),
                    "student_id" : r.get("student_id"),
                    "student_name" : student_name,
                    "date" : str(r.get("date", "")),
                    "status" : r.get("status", "present"),
                    "method" : r.get("method", "manual"),
                    "confidence" : r.get("confidence"),
                    "marked_at" : str(r.get("marked_at", ""))
                }
            )
        return records
    except Exception as e:
        raise DatabaseOperationError(f"Error fetching class attendance: {e}") from e


def get_attendance_for_student(
    student_id: Any,
    class_id: Optional[Any] = None,
    date_str: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetch historical attendance record for a student, optionally filtered by class and date."""
    
    try:
        query = (
            supabase.table("attendance")
            .select("attendance_id, class_id, student_id, date, status, method, confidence, marked_at, students(name)")
            .eq("student_id", student_id)
        )
        if class_id:
            query = query.eq("class_id", class_id)
        if date_str:
            query = query.eq("date", date_str)
        response = query.order("date", desc=True).execute()
        records = []
        for r in response.data or []:
            student_name = r.get("students", {}).get("name") if r.get("students") else None
            records.append(
                {
                    "attendance_id": r.get("attendance_id"),
                    "class_id": r.get("class_id"),
                    "student_id": r.get("student_id"),
                    "student_name": student_name,
                    "date": str(r.get("date", "")),
                    "status": r.get("status", "present"),
                    "method": r.get("method", "manual"),
                    "confidence": r.get("confidence"),
                    "marked_at": str(r.get("marked_at", ""))
                }
            )
        return records
    except Exception as e:
        raise DatabaseOperationError(f"Error fetching student attendance: {e}") from e

