from typing import Any, Dict, List, Optional, Tuple

from app.database.client import supabase


class UserAlreadyExistsError(Exception):
    """Raised when an account with the username already exists."""
    pass


class DatabaseOperationError(Exception):
    """Raised when a database query or mutation fails."""
    pass


def get_table_and_id_field(role: str) -> Tuple[str, str]:
    """Return the table name and primary id column for the given role."""
    if role == "teacher":
        return "teachers", "teacher_id"
    return "students", "student_id"


def extract_user_id(user_record: Dict[str, Any], fallback_field: str) -> Any:
    """Extract primary ID handling both specific field and generic 'id' column."""
    if user_record.get(fallback_field) is not None:
        return user_record[fallback_field]
    if user_record.get("id") is not None:
        return user_record["id"]
    return user_record.get(fallback_field)


def get_user_by_username(role: str, username: str) -> Optional[Dict[str, Any]]:
    """Fetch a user record by username and role."""
    table, _ = get_table_and_id_field(role)
    try:
        response = (
            supabase.table(table)
            .select("*")
            .eq("username", username.strip())
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        raise DatabaseOperationError(f"Failed to query user by username: {e}") from e


def get_user_by_id(role: str, user_id: Any) -> Optional[Dict[str, Any]]:
    """Fetch a user record by primary key ID and role."""
    table, id_field = get_table_and_id_field(role)
    try:
        response = (
            supabase.table(table)
            .select("*")
            .eq(id_field, user_id)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]

        # If user_id is digit string, try integer match
        if isinstance(user_id, str) and user_id.isdigit():
            response = (
                supabase.table(table)
                .select("*")
                .eq(id_field, int(user_id))
                .limit(1)
                .execute()
            )
            if response.data and len(response.data) > 0:
                return response.data[0]
        
        # Optional fallback to generic 'id' if table schema uses 'id'
        if id_field != "id":
            try:
                response = (
                    supabase.table(table)
                    .select("*")
                    .eq("id", user_id)
                    .limit(1)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    return response.data[0]
            except Exception:
                pass
        return None
    except Exception as e:
        raise DatabaseOperationError(f"Failed to query user by id: {e}") from e


def create_user(
    role: str,
    username: str,
    hashed_password: str,
    name: str
) -> Dict[str, Any]:
    """Create a new teacher or student account record."""
    table, id_field = get_table_and_id_field(role)
    record = {
        "username": username.strip(),
        "password": hashed_password,
        "name": name.strip()
    }

    try:
        response = supabase.table(table).insert(record).execute()
    except Exception as e:
        err_msg = str(e).lower()
        if "23505" in err_msg or "duplicate key" in err_msg or "already exists" in err_msg:
            raise UserAlreadyExistsError(f"Username '{username}' is already taken.") from e
        raise DatabaseOperationError(f"Database error during account creation: {e}") from e

    if not response.data or len(response.data) == 0:
        raise DatabaseOperationError("Account was not created in database.")

    return response.data[0]


def update_student_face_embedding(
    student_id: Any,
    embedding: List[float]
) -> bool:
    """Store the facial embedding vector for a student."""
    sid = int(student_id) if isinstance(student_id, str) and student_id.isdigit() else student_id
    try:
        response = (
            supabase.table("students")
            .update({"face_embedding" : embedding})
            .eq("student_id", sid)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise DatabaseOperationError(f"Failed to update face embedding: {e}") from e


def update_student_voice_embedding(
    student_id: Any,
    embedding: List[float]
) -> bool:
    """Store the voice embedding vector for a student."""
    sid = int(student_id) if isinstance(student_id, str) and student_id.isdigit() else student_id
    try:
        response = (
            supabase.table("students")
            .update({"voice_embedding" : embedding})
            .eq("student_id", sid)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise DatabaseOperationError(f"Failed to update voice embedding: {e}") from e


def clear_student_biometrics(student_id: Any) -> bool:
    """Clear face and voice embeddings for a student (data privacy & consent withdrawal)."""
    sid = int(student_id) if isinstance(student_id, str) and student_id.isdigit() else student_id
    try:
        response = (
            supabase.table("students")
            .update({"face_embedding": None, "voice_embedding": None})
            .eq("student_id", sid)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise DatabaseOperationError(f"Failed to clear student biometrics: {e}") from e


def get_student_biometrics(student_id: Any) -> Optional[Dict[str, Any]]:
    """Retrieve facial and voice embeddings for recognition verification."""
    sid = int(student_id) if isinstance(student_id, str) and student_id.isdigit() else student_id
    try:
        response = (
            supabase.table("students")
            .select("student_id, name, face_embedding, voice_embedding")
            .eq("student_id", sid)
            .limit(1)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        raise DatabaseOperationError(f"Failed to fetch student biometrics: {e}") from e
    