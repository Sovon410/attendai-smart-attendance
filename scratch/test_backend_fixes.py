# """
# Unit and integration test suite to verify backend fixes:
# 1. Face distance calibration (compare_faces)
# 2. Voice comparison (compare_voices)
# 3. Schema compatibility (attendance_date/attendance_daate, AttendanceSummary)
# 4. Config alias (access_token_minutes, access_tokn_minutes)
# 5. Security hashing & token generation
# 6. Attendance service manual status & history student_name propagation
# 7. Repository silent None fix
# """
# import os
# import sys

# # Ensure root directory is in sys.path
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# import unittest
# from datetime import date
# from unittest.mock import MagicMock, patch

# from app.core.config import settings
# from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
# from app.pipelines.face_pipeline import compare_faces, compute_face_distance
# from app.pipelines.voice_pipeline import compare_voices
# from app.schemas.attendance import (
#     AttendaanceVerificationResponse,
#     AttendanceRecordOut,
#     AttendanceSummary,
#     AttendanceVerificationResponse,
#     ManualAttendanceRequest,
# )
# from app.schemas.student import RegisterBiometricResponse, RegisterBiometricRespnse
# from app.services.attendance_service import (
#     get_student_attendance_summary,
#     get_user_attendance_history,
#     manual_mark_student_attendance,
# )


# class TestBackendFixes(unittest.TestCase):
#     def test_security_hash_and_token(self):
#         pwd = "SecurePassword123!"
#         hashed = hash_password(pwd)
#         self.assertTrue(verify_password(pwd, hashed))
#         self.assertFalse(verify_password("WrongPassword", hashed))

#         token = create_access_token(subject="user_123", role="teacher")
#         decoded = decode_access_token(token)
#         self.assertEqual(decoded["sub"], "user_123")
#         self.assertEqual(decoded["role"], "teacher")

#     def test_config_access_token_alias(self):
#         self.assertEqual(settings.access_token_minutes, settings.access_tokn_minutes)
#         self.assertGreater(settings.access_token_minutes, 0)

#     def test_schema_attendance_date_alias(self):
#         req1 = ManualAttendanceRequest(class_id=1, student_id=2, status="late", attendance_date="2026-11-24")
#         self.assertEqual(str(req1.attendance_date), "2026-11-24")
#         self.assertEqual(str(req1.attendance_daate), "2026-11-24")

#         # Test typo alias field in input dict
#         req2 = ManualAttendanceRequest(class_id=1, student_id=2, status="absent", attendance_daate="2026-11-25")
#         self.assertEqual(str(req2.attendance_date), "2026-11-25")
#         self.assertEqual(str(req2.attendance_daate), "2026-11-25")

#     def test_schema_attendance_summary(self):
#         summary = AttendanceSummary(
#             total_records=10,
#             present_count=8,
#             absent_count=1,
#             late_count=1,
#             attendance_percentage=85.0
#         )
#         self.assertIsInstance(summary.late_count, int)
#         self.assertEqual(summary.late_count, 1)

#     def test_schema_aliases(self):
#         self.assertIs(AttendaanceVerificationResponse, AttendanceVerificationResponse)
#         self.assertIs(RegisterBiometricRespnse, RegisterBiometricResponse)

#     def test_face_confidence_calibration(self):
#         # 128-d zero vector and matching vector -> distance 0.0
#         v1 = [0.0] * 128
#         v2 = [0.0] * 128
#         is_match, conf = compare_faces(v1, v2, threshold=0.6)
#         self.assertTrue(is_match)
#         # Should be high confidence (> 0.95), not overflow or error
#         self.assertGreater(conf, 0.95)

#         # Distance exactly at threshold 0.6 -> confidence should be 0.5 (50%)
#         # Euclidean norm of vector with single element 0.6 is 0.6
#         v3 = [0.6] + [0.0] * 127
#         is_match, conf = compare_faces(v1, v3, threshold=0.6)
#         self.assertTrue(is_match)
#         self.assertAlmostEqual(conf, 0.50, places=2)

#         # Distance above threshold (0.8) -> is_match False, confidence < 0.5
#         v4 = [0.8] + [0.0] * 127
#         is_match, conf = compare_faces(v1, v4, threshold=0.6)
#         self.assertFalse(is_match)
#         self.assertLess(conf, 0.50)

#     def test_voice_comparison(self):
#         v1 = [1.0] * 256
#         v2 = [1.0] * 256
#         is_match, conf = compare_voices(v1, v2, threshold=0.75)
#         self.assertTrue(is_match)
#         self.assertAlmostEqual(conf, 1.0, places=2)

#     @patch("app.services.attendance_service.get_class_by_id")
#     @patch("app.services.attendance_service.is_student_enrolled")
#     @patch("app.services.attendance_service.record_attendance")
#     @patch("app.services.attendance_service.get_user_by_id")
#     def test_manual_mark_passes_status_and_returns_student_name(
#         self, mock_get_user, mock_record, mock_enrolled, mock_get_class
#     ):
#         mock_get_class.return_value = {"class_id": 10, "teacher_id": 5}
#         mock_enrolled.return_value = True
#         mock_get_user.return_value = {"student_id": 7, "name": "Jane Doe"}
#         mock_record.return_value = {
#             "attendance_id": 99,
#             "class_id": 10,
#             "student_id": 7,
#             "date": "2026-11-24",
#             "status": "late",
#             "method": "manual",
#             "confidence": 1.0,
#             "marked_at": "2026-11-24T10:00:00"
#         }

#         payload = ManualAttendanceRequest(
#             class_id=10,
#             student_id=7,
#             status="late",
#             attendance_date="2026-11-24"
#         )
#         res = manual_mark_student_attendance(teacher_id=5, payload=payload)

#         # Verify status="late" was passed to record_attendance
#         mock_record.assert_called_once_with(
#             class_id=10,
#             student_id=7,
#             method="manual",
#             status="late",
#             confidence=1.0,
#             date_str="2026-11-24"
#         )
#         self.assertEqual(res.status, "late")
#         self.assertEqual(res.student_name, "Jane Doe")

#     @patch("app.services.attendance_service.get_class_by_id")
#     @patch("app.services.attendance_service.get_attendance_for_class")
#     def test_teacher_history_includes_student_name(self, mock_att_class, mock_get_class):
#         mock_get_class.return_value = {"class_id": 10, "teacher_id": 5}
#         mock_att_class.return_value = [
#             {
#                 "attendance_id": 1,
#                 "class_id": 10,
#                 "student_id": 7,
#                 "student_name": "Jane Doe",
#                 "date": "2026-11-24",
#                 "status": "present",
#                 "method": "photo",
#                 "confidence": 0.92,
#                 "marked_at": "2026-11-24T09:00:00"
#             }
#         ]
#         user = {"_id": 5, "_role": "teacher"}
#         history = get_user_attendance_history(user=user, class_id=10)
#         self.assertEqual(len(history), 1)
#         self.assertEqual(history[0].student_name, "Jane Doe")


#     @patch("app.database.repositories.attendance.supabase")
#     def test_record_attendance_updates_existing_record(self, mock_sb):
#         # Mock existing record found
#         mock_select = MagicMock()
#         mock_select.data = [{"attendance_id": 42}]
#         mock_table = MagicMock()
#         mock_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = mock_select
        
#         # Mock update response
#         mock_update = MagicMock()
#         mock_update.data = [{
#             "attendance_id": 42,
#             "class_id": 1,
#             "student_id": 2,
#             "date": "2026-11-24",
#             "status": "late",
#             "method": "manual",
#             "confidence": 1.0,
#             "marked_at": "2026-11-24T12:00:00+00:00"
#         }]
#         mock_table.update.return_value.eq.return_value.execute.return_value = mock_update
#         mock_sb.table.return_value = mock_table

#         from app.database.repositories.attendance import record_attendance
#         result = record_attendance(class_id=1, student_id=2, method="manual", status="late", confidence=1.0, date_str="2026-11-24")

#         self.assertEqual(result["attendance_id"], 42)
#         self.assertEqual(result["status"], "late")
#         # Verify update was called with status, method, confidence, and marked_at
#         called_args, _ = mock_table.update.call_args
#         self.assertEqual(called_args[0]["status"], "late")
#         self.assertEqual(called_args[0]["method"], "manual")
#         self.assertIn("marked_at", called_args[0])

#     def test_extract_voice_embedding_from_webm(self):
#         import subprocess, io, soundfile as sf, numpy as np
#         from app.pipelines.voice_pipeline import extract_voice_embedding

#         # Generate 2 seconds of audio
#         sr = 16000
#         t = np.linspace(0, 2, sr * 2)
#         sine = np.sin(2 * np.pi * 440 * t).astype(np.float32)

#         wav_io = io.BytesIO()
#         sf.write(wav_io, sine, sr, format='WAV')
#         wav_bytes = wav_io.getvalue()

#         # Encode to WebM Opus (matching browser MediaRecorder)
#         proc = subprocess.run(
#             ['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-c:a', 'libopus', '-f', 'webm', 'pipe:1'],
#             input=wav_bytes,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             check=True
#         )
#         webm_bytes = proc.stdout

#         # Verify extract_voice_embedding successfully handles WebM without LibsndfileError
#         embedding = extract_voice_embedding(webm_bytes)
#         self.assertIsNotNone(embedding)
#         self.assertEqual(len(embedding), 256)
#         self.assertIsInstance(embedding[0], float)

#     def test_invalid_audio_returns_none_cleanly(self):
#         from app.pipelines.voice_pipeline import extract_voice_embedding
#         # Garbage bytes should return None instead of raising unhandled exception
#         self.assertIsNone(extract_voice_embedding(b"not-an-audio-file-at-all"))

#     def test_schema_attendance_date_alias_with_date_field(self):
#         # Test frontend sending { date: "2026-11-24" }
#         req = ManualAttendanceRequest(class_id=1, student_id=2, status="present", date="2026-11-24")
#         self.assertEqual(str(req.attendance_date), "2026-11-24")
#         self.assertEqual(str(req.date), "2026-11-24")

#     def test_schema_attendance_summary_synced_fields(self):
#         summary = AttendanceSummary(
#             total_records=15,
#             present_count=12,
#             absent_count=2,
#             late_count=1,
#             attendance_percentage=83.33
#         )
#         self.assertEqual(summary.total_sessions, 15)
#         self.assertEqual(summary.attendance_rate, 83.33)

#     def test_schema_student_enrolled_out_synced_fields(self):
#         from app.schemas.class_ import StudentEnrolledOut
#         student = StudentEnrolledOut(
#             student_id=42,
#             name="Alice",
#             username="alice",
#             has_face_registered=True,
#             has_voice_registered=False
#         )
#         self.assertEqual(student.id, 42)
#         self.assertTrue(student.face_registered)
#         self.assertFalse(student.voice_registered)

#     def test_invalid_image_returns_none_cleanly(self):
#         from app.pipelines.face_pipeline import extract_face_embedding
#         # Corrupted / invalid image bytes should return None without crashing
#         self.assertIsNone(extract_face_embedding(b"invalid-image-bytes-12345"))
#         self.assertIsNone(extract_face_embedding(b""))

#     def test_face_distance_mismatched_dimension_guard(self):
#         # Mismatched lengths should return 1.0 (no match) instead of raising ValueError
#         dist = compute_face_distance([0.0] * 128, [0.0] * 64)
#         self.assertEqual(dist, 1.0)
#         dist_empty = compute_face_distance([], [0.0] * 128)
#         self.assertEqual(dist_empty, 1.0)

#     def test_voice_comparison_mismatched_dimension_guard(self):
#         # Mismatched lengths should return (False, 0.0) instead of raising ValueError
#         is_match, score = compare_voices([1.0] * 256, [1.0] * 128)
#         self.assertFalse(is_match)
#         self.assertEqual(score, 0.0)

#     @patch("app.services.attendance_service.get_attendance_for_student")
#     def test_student_history_passes_date_filter(self, mock_att_student):
#         mock_att_student.return_value = [
#             {
#                 "attendance_id": 9,
#                 "class_id": 1,
#                 "student_id": 7,
#                 "student_name": "Student A",
#                 "date": "2026-11-20",
#                 "status": "present",
#                 "method": "voice",
#                 "confidence": 0.95,
#                 "marked_at": "2026-11-20T10:00:00"
#             }
#         ]
#         user = {"_id": 7, "_role": "student"}
#         history = get_user_attendance_history(user=user, class_id=1, date_str="2026-11-20")
#         mock_att_student.assert_called_once_with(7, 1, date_str="2026-11-20")
#         self.assertEqual(len(history), 1)
#         self.assertEqual(history[0].id, 9)
#         self.assertEqual(history[0].attendance_date, "2026-11-20")


# if __name__ == "__main__":
#     unittest.main()
