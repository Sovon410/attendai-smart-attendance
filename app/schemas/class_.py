from typing import Any, List, Optional
from pydantic import BaseModel, Field


class ClassCreate(BaseModel):
    class_name: str = Field(min_length=2, max_length=100, description="Name of the course/subject")


class ClassResponse(BaseModel):
    class_id: Any
    class_name: str
    class_code: str
    teacher_id: Any


class EnrollRequest(BaseModel):
    class_code: str = Field(min_length=4, max_length=12, description="Class join code")


class EnrollmentResponse(BaseModel):
    class_id: Any
    class_name: str
    message: str


class StudentEnrolledOut(BaseModel):
    student_id: Any
    id: Optional[Any] = None
    name: str
    username: str
    has_face_registered: bool = False
    has_voice_registered: bool = False
    face_registered: Optional[bool] = None
    voice_registered: Optional[bool] = None

    def model_post_init(self, __context: Any) -> None:
        if self.id is None:
            self.id = self.student_id
        if self.face_registered is None:
            self.face_registered = self.has_face_registered
        if self.voice_registered is None:
            self.voice_registered = self.has_voice_registered
