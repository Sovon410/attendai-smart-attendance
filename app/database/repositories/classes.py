from typing import Any, Dict, List, Optional

from app.database.client import supabase
from app.database.repositories.users import DatabaseOperationError

def create_class(
    teacher_id: Any,
    class_name: str,
    class_code: str
) -> Dict[str, Any]:
    """Insert a new classroom record into the database."""
    record = {
        "teacher_id" : teacher_id,
        "class_name" : class_name.strip(),
        "class_code" : class_code.strip().upper()
    }
    
    try:
        response = (
            supabase.table("classes")
            .insert(record)
            .execute()
        )
        if not response.data:
            raise DatabaseOperationError("Failed to create class.")
        return response.data[0]
    except Exception as e:
        raise DatabaseOperationError(f"Database error creating class: {e}") from e


def get_class_by_code(class_code: str) -> Optional[Dict[str, Any]]:
    """Find a class by its unique alphanumeric join code."""
    try:
        response = (
            supabase.table("classes")
            .select("*")
            .eq("class_code", class_code.strip().upper())
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        raise DatabaseOperationError(f"Error querying class by code: {e}") from e


def get_class_by_id(class_id: Any) -> Optional[Dict[str, Any]]:
    """Find a class by its primary key ID."""
    try:
        response = (
            supabase.table("classes")
            .select("*")
            .eq("class_id", class_id)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        if isinstance(class_id, str) and class_id.isdigit():
            response = (
                supabase.table("classes")
                .select("*")
                .eq("class_id", int(class_id))
                .limit(1)
                .execute()
            )
            if response.data and len(response.data) > 0:
                return response.data[0]
        return None
    except Exception as e:
        raise DatabaseOperationError(f"Error querying class by ID: {e}") from e


def list_classes_by_teacher(teacher_id: Any) -> List[Dict[str, Any]]:
    """List all classes created by a specific teacher."""
    try:
        response = (
            supabase.table("classes")
            .select("*")
            .eq("teacher_id", teacher_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        raise DatabaseOperationError(f"Error listing teacher classes: {e}") from e


def is_student_enrolled(
    class_id: Any,
    student_id: Any
) -> bool:
    """Check if a student already emrolled in a class."""
    try:
        response = (
            supabase.table("enrollments")
            .select("enrollment_id")
            .eq("class_id", class_id)
            .eq("student_id", student_id)
            .limit(1)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise DatabaseOperationError(f"Error checking student enrollment: {e}") from e


def enroll_student_in_class(
    class_id: Any,
    student_id: Any
) -> Dict[str, Any]:
    """Enroll a student into a class."""
    record = {
        "class_id" : class_id,
        "student_id" : student_id
    }
    
    try:
        response = (
            supabase.table("enrollments")
            .insert(record)
            .execute()
        )
        if not response.data:
            raise DatabaseOperationError(f"Failed to enroll student.")
        return response.data[0]
    except Exception as e:
        raise DatabaseOperationError(f"Error enrolling student: {e}") from e


def list_classes_by_student(student_id: Any) -> List[Dict[str, Any]]:
    """List all classes a student is enrolled in."""
    
    try:
        response = (
            supabase.table("enrollments")
            .select("class_id, classes(*)")
            .eq("student_id", student_id)
            .execute()
        )
        classes = []
        for item in response.data or []:
            if item.get("classes"):
                classes.append(item["classes"])
        return classes
    except Exception as e:
        raise DatabaseOperationError(f"Error listing student classes: {e}") from e


def list_enrolled_student(class_id: Any) -> List[Dict[str, Any]]:
    """Retrieve all the student currently enrolled in a class."""
    
    try:
        response = (
            supabase.table("enrollments")
            .select("student_id, students(student_id, name, username, face_embedding, voice_embedding)")
            .eq("class_id", class_id)
            .execute()
        )
        students = []
        for item in response.data or []:
            s = item.get("students")
            if s:
                students.append(
                    {
                        "student_id" : s.get("student_id"),
                        "name" : s.get("name", ""),
                        "username" : s.get("username", ""),
                        "has_face_registered" : s.get("face_embedding") is not None,
                        "has_voice_registered" : s.get("voice_embedding") is not None
                    }
                )
        return students
    except Exception as e:
        raise DatabaseOperationError(f"Error fetching enrolled roster: {e}") from e

