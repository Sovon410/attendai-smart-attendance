from typing import Any, Dict

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_student
from app.schemas.student import BiometricStatusResponse, RegisterBiometricResponse, StudentProfile
from app.services.recognition_service import enroll_student_face, enroll_student_voice


router = APIRouter(
    prefix="/api/v1/students",
    tags=["students"]
)


@router.get(
    "/me",
    response_model=StudentProfile
)
def get_student_profile(
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> StudentProfile:
    """Retrieve profile and biometrics status for the authenticated student."""
    return StudentProfile(
        student_id=current_student.get("student_id") or current_student.get("id"),
        username=current_student.get("username", ""),
        name=current_student.get("name", ""),
        has_face_registered=current_student.get("face_embedding") is not None,
        has_voice_registered=current_student.get("voice_embedding") is not None
    )


@router.get(
    "/me/biometrics",
    response_model=BiometricStatusResponse,
    summary="Check whether student has face/voice registered."
)
def get_biometric_status(
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> BiometricStatusResponse:
    """Check if the student has completed face and voice enrollment."""
    return BiometricStatusResponse(
        has_face_registered=current_student.get("face_embedding") is not None,
        has_voice_registered=current_student.get("voice_embedding") is not None
    )


@router.delete(
    "/me/biometrics",
    response_model=RegisterBiometricResponse,
    summary="Clear registered biometrics (Consent withdrawal)"
)
def delete_biometrics(
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> RegisterBiometricResponse:
    """Permanently delete registered facial and voice biometrics for the authenticated student."""
    from app.database.repositories.users import clear_student_biometrics
    student_id = current_student.get("_id")
    clear_student_biometrics(student_id)
    return RegisterBiometricResponse(
        success=True,
        message="Biometrics successfully erased from database."
    )


@router.post(
    "/enroll-face",
    response_model=RegisterBiometricResponse,
    summary="Enroll student face biometrics from photo"
)
async def enroll_face(
    file: UploadFile = File(...),
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> RegisterBiometricResponse:
    """Detect and store face embedding vector for the authenticated student."""
    student_id = current_student.get("_id")
    image_bytes = await file.read()
    res = enroll_student_face(student_id, image_bytes)
    return RegisterBiometricResponse(**res)


@router.post(
    "/enroll-voice",
    response_model=RegisterBiometricResponse,
    summary="Enroll student voice biometrics from audio sample"
)
async def enroll_voice(
    file: UploadFile = File(...),
    current_student: Dict[str, Any] = Depends(get_current_student)
) -> RegisterBiometricResponse:
    """Extract and store voice embedding vector for the authenticated student."""
    student_id = current_student.get("_id")
    audio_bytes = await file.read()
    res = enroll_student_voice(student_id, audio_bytes)
    return RegisterBiometricResponse(**res)
