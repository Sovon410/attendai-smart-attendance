from typing import Any, Optional
from pydantic import BaseModel

class StudentProfile(BaseModel):
    student_id: int
    username: str
    name: str
    has_face_registered: bool = False
    has_voice_registered: bool = False
    face_registered: Optional[bool] = None
    voice_registered: Optional[bool] = None

    def model_post_init(self, __context: Any) -> None:
        if self.face_registered is None:
            self.face_registered = self.has_face_registered
        if self.voice_registered is None:
            self.voice_registered = self.has_voice_registered


class TeacherProfile(BaseModel):
    teacher_id: int
    username: str
    name: str


class BiometricStatusResponse(BaseModel):
    has_face_registered: bool
    has_voice_registered: bool
    face_registered: Optional[bool] = None
    voice_registered: Optional[bool] = None

    def model_post_init(self, __context: Any) -> None:
        if self.face_registered is None:
            self.face_registered = self.has_face_registered
        if self.voice_registered is None:
            self.voice_registered = self.has_voice_registered


class RegisterBiometricResponse(BaseModel):
    success: bool
    message: str


RegisterBiometricRespnse = RegisterBiometricResponse

