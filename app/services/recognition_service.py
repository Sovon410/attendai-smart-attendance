from typing import Any, Dict

from fastapi import HTTPException, status

from app.database.repositories.attendance import has_marked_attendance_today, record_attendance
from app.database.repositories.classes import is_student_enrolled
from app.database.repositories.users import (
    DatabaseOperationError,
    get_student_biometrics,
    update_student_face_embedding,
    update_student_voice_embedding
)
from app.pipelines.face_pipeline import compare_faces, extract_face_embedding
from app.pipelines.voice_pipeline import compare_voices, extract_voice_embedding
from app.schemas.attendance import AttendanceVerificationResponse


def enroll_student_face(
    student_id: Any,
    image_bytes: bytes
) -> Dict[str, Any]:
    """Extract and save face biometric embedding for student registration."""
    embedding = extract_face_embedding(image_bytes)
    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in the photo. Please ensure clear lighting and look directly into the camera."
        )
        
    try:
        update_student_face_embedding(student_id, embedding)
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to save facial embedding: {e}"
        ) from e
    
    return {
        "success" : True,
        "message" : "Face biometrics successfully enrolled."
    }


def enroll_student_voice(
    student_id: Any,
    audio_bytes: bytes
) -> Dict[str, Any]:
    """Extract and save voice embedding for student registration."""
    embedding = extract_voice_embedding(audio_bytes)
    if not embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice sample was empty or too short. Please speak clearly for at least 1-2 seconds."
        )
    
    try:
        update_student_voice_embedding(student_id, embedding)
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to save voice embedding: {e}"
        ) from e

    return {
        "success" : True,
        "message" : "Voice biometrics successfully enrolled."
    }


def verify_and_mark_photo(
    class_id: Any,
    student_id: Any,
    image_bytes: bytes
) -> AttendanceVerificationResponse:
    """Verify live face photo against registered biometrics and record attendance."""
    
    # 1. Check class enrollment.
    if not is_student_enrolled(class_id, student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this class."
        )
    
    # 2. Check duplicate attendance for today.
    if has_marked_attendance_today(class_id, student_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance has already been recorded for this class today."
        )
    
    # 3. Retrive registered face embedding.
    student_data = get_student_biometrics(student_id)
    if not student_data or not student_data.get("face_embedding"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not enrolled your face biometrics yet. Please register your face first."
        )
    
    # 4. Extract live face embedding.
    live_embedding = extract_face_embedding(image_bytes)
    if not live_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in live photo. Please position your face clearly in frame."
        )
    
    # 5. Biometric comparison.
    is_match, confidence = compare_faces(
        student_data["face_embedding"],
        live_embedding,
        threshold=0.6
    )
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Facial verification failed (match confidence {round(confidence * 100, 1)}% is below verification threshold.)"
        )
    
    # 6. Record attendance.
    try:
        record_attendance(
            class_id=class_id,
            student_id=student_id,
            method="photo",
            status="present",
            confidence=confidence
        )
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to record attendance: {e}"
        ) from e
    
    return AttendanceVerificationResponse(
        success=True,
        student_id=student_id,
        student_name=student_data.get("name", ""),
        class_id=class_id,
        status="present",
        method="photo",
        confidence=confidence,
        message="Face attendance verified and recorded successfully."
    )


def verify_and_mark_voice(
    class_id: Any,
    student_id: Any,
    audio_bytes: bytes
) -> AttendanceVerificationResponse:
    """Verify live voice recording against registered biometrics and record attendance."""
    
    # 1. Check enrollment.
    if not is_student_enrolled(class_id, student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this class."
        )
    
    # 2. Check duplicate for today.
    if has_marked_attendance_today(class_id, student_id):
       raise HTTPException(
           status_code=status.HTTP_409_CONFLICT,
           detail="Attendance has already been recorded for this class today."
       ) 
    
    # 3. Retrieve registered voice embedding.
    student_data = get_student_biometrics(student_id)
    if not student_data or not student_data.get("voice_embedding"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have not enrolled your voice biometrics yet. Please register your voice first."
        )
    
    # 4. Extract live voice embedding
    live_embedding = extract_voice_embedding(audio_bytes)
    if not live_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audible voice detected in audio sample. Please speak loudly and clearly."
        )
    
    # 5. Biometric comparison
    is_match, confidence = compare_voices(
        student_data["voice_embedding"],
        live_embedding,
        threshold=0.75
    )
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Voice verification failed (similarity score {round(confidence * 100, 1)}% is below verification threshold)."
        )
    
    # 6. Record attendance
    try:
        record_attendance(
            class_id=class_id,
            student_id=student_id,
            method="voice",
            status="present",
            confidence=confidence
        )
    except DatabaseOperationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to record attendance: {e}"
        ) from e
    
    return AttendanceVerificationResponse(
        success=True,
        student_id=student_id,
        student_name=student_data.get("name", ""),
        class_id=class_id,
        status="present",
        method="voice",
        confidence=confidence,
        message="Voice attendance verified and recorded successfully."
    )
