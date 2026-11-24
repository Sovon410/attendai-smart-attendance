import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// ──────────────────────────────────────────────────────────────────
// Section 1: My Classes Component
// ──────────────────────────────────────────────────────────────────
function MyClassesSection({
  classes,
  copyToClipboard,
  setSelectedClassId,
  setActiveTab,
  setCreatedClassCode,
  setNewClassName,
  setCreateModalOpen,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Teacher Workspace
          </span>
          <h1 className="font-headline-lg text-on-surface">My classes</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreatedClassCode(null);
            setNewClassName("");
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Create class</span>
        </button>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-outline-variant/30 flex flex-col justify-between gap-6 relative overflow-hidden group"
            >
              <div className="w-24 h-24 rounded-full bg-primary-fixed/40 -mr-8 -mt-8 absolute top-0 right-0 pointer-events-none group-hover:scale-110 transition-transform duration-300"></div>

              <div>
                <h2 className="font-headline-sm text-on-surface relative z-10 truncate font-semibold mb-3">
                  {cls.class_name}
                </h2>

                <div className="bg-surface-container-low rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 border border-outline-variant/20 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm uppercase text-on-surface-variant font-semibold">Join code</span>
                    <span className="font-mono font-label-lg text-primary tracking-widest font-bold">
                      {cls.class_code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cls.class_code)}
                    title="Copy join code"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setActiveTab("class-roster");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container text-on-surface font-label-md hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>View roster</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setActiveTab("attendance-records");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-fixed text-on-primary-fixed-variant font-label-md hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  <span>Attendance</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h2 className="font-headline-sm text-on-surface font-semibold">No Classes Created Yet</h2>
          <p className="font-body-md text-on-surface-variant max-w-md">
            Create your first course to generate a unique 6-character code that your students can use to join your roster.
          </p>
          <button
            type="button"
            onClick={() => {
              setCreatedClassCode(null);
              setNewClassName("");
              setCreateModalOpen(true);
            }}
            className="mt-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-primary-container transition-colors shadow-sm"
          >
            + Create Your First Class
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 2: Class Roster Component
// ──────────────────────────────────────────────────────────────────
function ClassRosterSection({
  classes,
  selectedClassId,
  setSelectedClassId,
  selectedClassObj,
  totalStudents,
  faceEnrolledCount,
  voiceEnrolledCount,
  rosterSearch,
  setRosterSearch,
  filteredRoster,
  copyToClipboard,
  setManualStudentId,
  setManualModalOpen,
  setActiveTab,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <button
          type="button"
          onClick={() => setActiveTab("my-classes")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md self-start"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to My classes</span>
        </button>

        {classes.length > 1 && (
          <div className="relative min-w-[200px]">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-label-md border border-outline-variant/30 appearance-none cursor-pointer focus:outline-none"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none"></div>
          <div>
            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Class Roster &amp; Readiness
            </span>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <h1 className="font-headline-lg text-on-surface font-semibold">{selectedClassObj?.class_name}</h1>
              {selectedClassObj?.class_code && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedClassObj.class_code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors shadow-sm font-label-sm"
                >
                  <span className="uppercase text-[11px] opacity-75">Join Code</span>
                  <span className="font-mono font-bold tracking-widest">{selectedClassObj.class_code}</span>
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              )}
            </div>
          </div>
          <p className="font-body-sm text-on-surface-variant max-w-lg">
            Manage enrolled students, check facial and voiceprint enrollment statuses, and record attendance overrides.
          </p>
        </div>

        <div className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-surface-container-high text-on-primary-fixed-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </span>
              <span className="font-label-sm uppercase text-on-surface-variant">Active</span>
            </div>
            <div>
              <div className="font-headline-md text-on-surface tabular-nums">{totalStudents}</div>
              <div className="font-label-sm text-on-surface-variant">Total students</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">face</span>
              </span>
              <span className="font-label-sm text-secondary font-semibold">
                {totalStudents > 0 ? `${Math.round((faceEnrolledCount / totalStudents) * 100)}%` : "0%"}
              </span>
            </div>
            <div>
              <div className="font-headline-md text-on-surface tabular-nums">
                {faceEnrolledCount} / {totalStudents}
              </div>
              <div className="font-label-sm text-on-surface-variant">Face enrolled</div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
              </span>
              <span className="font-label-sm text-tertiary font-semibold">
                {totalStudents > 0 ? `${Math.round((voiceEnrolledCount / totalStudents) * 100)}%` : "0%"}
              </span>
            </div>
            <div>
              <div className="font-headline-md text-on-surface tabular-nums">
                {voiceEnrolledCount} / {totalStudents}
              </div>
              <div className="font-label-sm text-on-surface-variant">Voice enrolled</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <h2 className="font-title-md text-on-surface font-semibold">Class Roster</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low font-label-sm text-on-surface-variant">
              {filteredRoster.length} Students
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Filter by name or username..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm focus:outline-none border border-outline-variant/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-6 py-3 font-label-sm uppercase text-on-surface-variant">Student name</th>
                <th className="px-6 py-3 font-label-sm uppercase text-on-surface-variant">Username</th>
                <th className="px-6 py-3 font-label-sm uppercase text-on-surface-variant">Face profile</th>
                <th className="px-6 py-3 font-label-sm uppercase text-on-surface-variant">Voice profile</th>
                <th className="px-6 py-3 font-label-sm uppercase text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm">
              {filteredRoster.length > 0 ? (
                filteredRoster.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 font-semibold flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-bold text-label-sm">
                        {(student.name || student.username || "S")[0].toUpperCase()}
                      </div>
                      <span>{student.name || student.username}</span>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">@{student.username}</td>
                    <td className="px-6 py-4">
                      {student.face_registered ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          <span>Enrolled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          <span>Missing</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.voice_registered ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          <span>Enrolled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          <span>Missing</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setManualStudentId(student.id);
                          setManualModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-container text-primary font-label-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        Mark Attendance
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-[36px] opacity-40">group_off</span>
                      <p className="font-title-md text-on-surface font-semibold">No students found</p>
                      <p className="text-body-sm max-w-sm">
                        Share the join code <strong className="text-primary font-mono">{selectedClassObj?.class_code}</strong> with your students to add them to this class.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 3: Attendance Records Component
// ──────────────────────────────────────────────────────────────────
function AttendanceRecordsSection({
  classes,
  selectedClassId,
  setSelectedClassId,
  attendanceDate,
  setAttendanceDate,
  attendanceRecords,
  presentCount,
  lateCount,
  absentCount,
  attendanceRate,
  setManualModalOpen,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Attendance Ledger
          </span>
          <h1 className="font-headline-lg text-on-surface">Attendance Records</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm uppercase text-on-surface-variant" htmlFor="records-class-select">
              Class *
            </label>
            <div className="relative min-w-[200px]">
              <select
                id="records-class-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm shadow-sm appearance-none cursor-pointer focus:outline-none border border-outline-variant/30"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.class_code})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm uppercase text-on-surface-variant" htmlFor="records-date-select">
              Date (Optional)
            </label>
            <input
              id="records-date-select"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm shadow-sm focus:outline-none tabular-nums border border-outline-variant/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label-sm uppercase text-transparent select-none">Action</span>
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="h-10 px-4 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Manual Mark</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm uppercase text-on-surface-variant font-semibold">
              Visible Session Summary
            </span>
            <p className="font-body-sm text-on-surface-variant">Live counts from current filtered roster</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-label-sm">Present</span>
              <span className="font-title-md tabular-nums ml-1">{presentCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high text-on-primary-fixed-variant font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="font-label-sm">Late</span>
              <span className="font-title-md tabular-nums ml-1">{lateCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-error-container text-on-error-container font-semibold">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="font-label-sm">Absent</span>
              <span className="font-title-md tabular-nums ml-1">{absentCount}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm uppercase text-on-surface-variant font-semibold">Attendance Rate</span>
            <span className="font-headline-md text-on-surface tabular-nums font-bold">{attendanceRate}%</span>
            <span className="font-body-sm text-on-surface-variant text-[12px]">Present + Late / Total</span>
          </div>
          <div className="w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" strokeWidth="3.5" className="text-surface-container" />
              <circle
                cx="18"
                cy="18"
                fill="none"
                r="15.915"
                stroke="currentColor"
                strokeDasharray={`${attendanceRate}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                className="text-secondary transition-all duration-500"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30 h-11">
                <th className="px-6 font-label-sm uppercase text-on-surface-variant">Student Name</th>
                <th className="px-6 font-label-sm uppercase text-on-surface-variant">Date</th>
                <th className="px-6 font-label-sm uppercase text-on-surface-variant">Method</th>
                <th className="px-6 font-label-sm uppercase text-on-surface-variant">Match Score</th>
                <th className="px-6 font-label-sm uppercase text-on-surface-variant">Status</th>
                <th className="px-6 font-label-sm uppercase text-on-surface-variant text-right">Marked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-sm">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((rec) => {
                  const statusLower = (rec.status || "").toLowerCase();
                  return (
                    <tr key={rec.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        {rec.student_name || rec.students?.name || rec.students?.username || "Student"}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-on-surface-variant">
                        {rec.attendance_date || rec.date}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 capitalize font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            {rec.method === "voice" ? "mic" : rec.method === "photo" ? "photo_camera" : "edit_note"}
                          </span>
                          <span>{rec.method || "Manual"}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rec.confidence ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm font-semibold tabular-nums">
                            {rec.confidence}%
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-[13px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full font-label-sm font-semibold inline-flex items-center gap-1.5 ${
                            statusLower === "present"
                              ? "bg-secondary-container text-on-secondary-container"
                              : statusLower === "late"
                              ? "bg-primary-fixed text-on-primary-fixed-variant"
                              : "bg-error-container text-on-error-container"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              statusLower === "present"
                                ? "bg-secondary"
                                : statusLower === "late"
                                ? "bg-primary"
                                : "bg-error"
                            }`}
                          />
                          <span className="capitalize">{rec.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-on-surface-variant">
                        {rec.marked_at ? new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[32px] block mb-2 opacity-40">event_busy</span>
                    <p className="font-title-md text-on-surface font-semibold">No attendance records found</p>
                    <p className="text-body-sm mt-1">Select another date or use Manual Mark to record attendance.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Main TeacherPortal Component
// ──────────────────────────────────────────────────────────────────
export default function TeacherPortal() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "my-classes";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [roster, setRoster] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Create Class Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdClassCode, setCreatedClassCode] = useState(null);

  // Manual Mark Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualStatus, setManualStatus] = useState("Present");
  const [manualDate, setManualDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");

  const loadTeacherClasses = useCallback(async () => {
    try {
      const clsList = await api.getClasses();
      setClasses(clsList || []);
      if (clsList && clsList.length > 0 && !selectedClassId) {
        setSelectedClassId(clsList[0].class_id || clsList[0].id);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Unable to load classes");
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadTeacherClasses();
  }, [loadTeacherClasses]);

  const loadRoster = useCallback(async (classId) => {
    if (!classId) return;
    try {
      const students = await api.getClassStudents(classId);
      setRoster(students || []);
      if (students && students.length > 0) {
        setManualStudentId(students[0].student_id || students[0].id);
      }
    } catch (err) {
      console.error("Failed to load roster:", err);
      setRoster([]);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadRoster(selectedClassId);
    }
  }, [selectedClassId, loadRoster]);

  const loadAttendance = useCallback(async (classId, date) => {
    if (!classId) return;
    try {
      const records = await api.getHistory({
        class_id: classId,
        date: date || undefined,
      });
      setAttendanceRecords(records || []);
    } catch (err) {
      console.error("Failed to load attendance records:", err);
      setAttendanceRecords([]);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadAttendance(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate, loadAttendance]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await api.createClass({ class_name: newClassName.trim() });
      setCreatedClassCode(res.class_code);
      toast.success("Class created successfully!");
      await loadTeacherClasses();
    } catch (err) {
      toast.error(err.message || "Failed to create class");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard!`);
  };

  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !manualStudentId) {
      setManualError("Please select a student.");
      return;
    }
    setManualSaving(true);
    setManualError("");
    try {
      await api.markManual({
        class_id: selectedClassId,
        student_id: manualStudentId,
        status: manualStatus,
        date: manualDate || undefined,
        attendance_date: manualDate || undefined,
      });
      toast.success("Attendance override recorded!");
      setManualModalOpen(false);
      loadAttendance(selectedClassId, attendanceDate);
    } catch (err) {
      setManualError(err.message || "Failed to save attendance.");
    } finally {
      setManualSaving(false);
    }
  };

  const selectedClassObj =
    classes.find((c) => String(c.class_id || c.id) === String(selectedClassId)) || classes[0];
  const totalStudents = roster.length;
  const faceEnrolledCount = roster.filter((s) => s.face_registered || s.has_face_registered).length;
  const voiceEnrolledCount = roster.filter((s) => s.voice_registered || s.has_voice_registered).length;

  const filteredRoster = roster.filter((s) => {
    const q = rosterSearch.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const userMatch = (s.username || "").toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  const presentCount = attendanceRecords.filter((r) => (r.status || "").toLowerCase() === "present").length;
  const lateCount = attendanceRecords.filter((r) => (r.status || "").toLowerCase() === "late").length;
  const absentCount = attendanceRecords.filter((r) => (r.status || "").toLowerCase() === "absent").length;
  const totalMarked = attendanceRecords.length;
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalMarked) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[260px] bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col pt-6 pb-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-headline-sm text-on-surface tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
            </div>
            <span className="font-bold">AttendAI</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("my-classes");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-label-lg transition-all text-left cursor-pointer ${
              activeTab === "my-classes" || activeTab === "class-roster"
                ? "bg-primary-container text-on-primary font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span>My Classes</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("attendance-records");
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-label-lg transition-all text-left cursor-pointer ${
              activeTab === "attendance-records"
                ? "bg-primary-container text-on-primary font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span>Attendance Records</span>
          </button>
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm">
              {(user?.name || user?.username || "T")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label-md text-on-surface truncate font-semibold">{user?.name || user?.username}</p>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Teacher / Staff</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 z-30 px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span className="font-title-md text-on-surface font-semibold capitalize hidden sm:inline-block">
              {activeTab === "class-roster" ? "Class Roster" : activeTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-label-lg text-on-surface">{user?.name || user?.username}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-semibold">
                Teacher
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors border border-outline-variant/40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Log out</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl">
          {activeTab === "my-classes" && (
            <MyClassesSection
              classes={classes}
              copyToClipboard={copyToClipboard}
              setSelectedClassId={setSelectedClassId}
              setActiveTab={setActiveTab}
              setCreatedClassCode={setCreatedClassCode}
              setNewClassName={setNewClassName}
              setCreateModalOpen={setCreateModalOpen}
            />
          )}
          {activeTab === "class-roster" && (
            <ClassRosterSection
              classes={classes}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              selectedClassObj={selectedClassObj}
              totalStudents={totalStudents}
              faceEnrolledCount={faceEnrolledCount}
              voiceEnrolledCount={voiceEnrolledCount}
              rosterSearch={rosterSearch}
              setRosterSearch={setRosterSearch}
              filteredRoster={filteredRoster}
              copyToClipboard={copyToClipboard}
              setManualStudentId={setManualStudentId}
              setManualModalOpen={setManualModalOpen}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "attendance-records" && (
            <AttendanceRecordsSection
              classes={classes}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              attendanceDate={attendanceDate}
              setAttendanceDate={setAttendanceDate}
              attendanceRecords={attendanceRecords}
              presentCount={presentCount}
              lateCount={lateCount}
              absentCount={absentCount}
              attendanceRate={attendanceRate}
              setManualModalOpen={setManualModalOpen}
            />
          )}
        </main>
      </div>

      {/* Create Class Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col gap-6 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">school</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface font-semibold">Create class</h3>
                  <p className="font-body-sm text-on-surface-variant">Set up a new roster for AI attendance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!createdClassCode ? (
              <form onSubmit={handleCreateClass} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-label-md text-on-surface" htmlFor="class-name-input">
                      Class name
                    </label>
                    <span className="font-label-sm text-on-surface-variant">{newClassName.length} / 100</span>
                  </div>
                  <input
                    id="class-name-input"
                    type="text"
                    maxLength={100}
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g. AP Calculus BC or CS 101"
                    autoFocus
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 border border-outline-variant/40"
                    required
                  />
                  <span className="font-body-sm text-on-surface-variant text-[12px]">
                    Must be between 2 and 100 characters.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newClassName.trim()}
                    className="px-6 py-2 rounded-lg bg-primary-container text-on-primary font-label-md shadow-sm hover:bg-primary transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {createLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Create class</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center text-center gap-5 py-3">
                <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Class Join Code
                  </span>
                  <div className="font-display-lg text-primary tracking-widest select-all font-mono font-bold">
                    {createdClassCode}
                  </div>
                  <p className="font-body-sm text-on-surface-variant">
                    Share this code with your students to let them join your roster.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdClassCode)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span>Copy code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Mark Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center sm:justify-end p-0 animate-fadeIn">
          <div className="w-full sm:max-w-md h-full bg-surface-container-lowest shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-l border-outline-variant/30">
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Manual Override
                  </span>
                  <h2 className="font-headline-md text-on-surface font-semibold">Manual Mark</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {manualError && (
                <div className="p-3.5 rounded-xl bg-error-container text-on-error-container flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                  <p className="font-body-sm">{manualError}</p>
                </div>
              )}

              <form onSubmit={handleManualMarkSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-on-surface" htmlFor="manual-student-select">
                    Student *
                  </label>
                  {roster.length > 0 ? (
                    <div className="relative">
                      <select
                        id="manual-student-select"
                        value={manualStudentId}
                        onChange={(e) => setManualStudentId(e.target.value)}
                        className="w-full h-11 pl-3.5 pr-8 rounded-lg bg-surface-container-low text-on-surface font-body-sm appearance-none cursor-pointer focus:outline-none border border-outline-variant/30"
                      >
                        {roster.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name || s.username} (@{s.username})
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  ) : (
                    <p className="font-body-sm text-error">No enrolled students in this class.</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-label-md text-on-surface">Status *</span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    {["Present", "Late", "Absent"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setManualStatus(s)}
                        className={`h-9 rounded-lg font-label-md font-semibold transition-all cursor-pointer ${
                          manualStatus === s
                            ? s === "Present"
                              ? "bg-secondary-container text-on-secondary-container shadow-sm"
                              : s === "Late"
                              ? "bg-tertiary-fixed text-on-tertiary-fixed-variant shadow-sm"
                              : "bg-error-container text-on-error-container shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-on-surface" htmlFor="manual-date-input">
                    Date *
                  </label>
                  <input
                    id="manual-date-input"
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none tabular-nums border border-outline-variant/30"
                    required
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-start gap-2.5 border border-tertiary-container/20">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                  <p className="font-body-sm text-[13px]">
                    Manual entries are recorded with 100% confidence and marked with a manual override tag.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setManualModalOpen(false)}
                    className="flex-1 h-11 px-4 rounded-lg bg-surface-container-low text-on-surface font-label-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={manualSaving || !manualStudentId}
                    className="flex-1 h-11 px-4 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {manualSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Save Record</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
