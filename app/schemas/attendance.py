import datetime as dt
from typing import Any, Literal, Optional
from pydantic import AliasChoices, BaseModel, Field


class ManualAttendanceRequest(BaseModel):
    class_id: int = Field(
        description="ID of the class"
    )
    student_id: int = Field(description="ID of the student")
    status: Literal["present", "absent", "late"] = "present"
    attendance_date: Optional[dt.date] = Field(
        default=None,
        validation_alias=AliasChoices("attendance_date", "attendance_daate", "date"),
        description="Date of the attendance (defaults to today)"
    )

    @property
    def attendance_daate(self) -> Optional[dt.date]:
        return self.attendance_date

    @property
    def date(self) -> Optional[dt.date]:
        return self.attendance_date


class AttendanceRecordOut(BaseModel):
    attendance_id: Any
    id: Optional[Any] = None
    class_id: Any
    student_id: Any
    student_name: Optional[str] = None
    date: str
    attendance_date: Optional[str] = None
    status: str
    method: str
    confidence: Optional[float] = None
    marked_at: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if self.id is None:
            self.id = self.attendance_id
        if self.attendance_date is None:
            self.attendance_date = self.date


class AttendanceVerificationResponse(BaseModel):
    success: bool
    student_id: Any
    student_name: str
    class_id: Any
    status: str
    method: str
    confidence: float
    message: str


AttendaanceVerificationResponse = AttendanceVerificationResponse


class AttendanceSummary(BaseModel):
    total_records: int
    present_count: int
    absent_count: int
    late_count: int
    attendance_percentage: float
    total_sessions: Optional[int] = None
    attendance_rate: Optional[float] = None

    def model_post_init(self, __context: Any) -> None:
        if self.total_sessions is None:
            self.total_sessions = self.total_records
        if self.attendance_rate is None:
            self.attendance_rate = self.attendance_percentage


