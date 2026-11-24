const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const BASE = `${API_ORIGIN}/api/v1`;
const STORAGE_KEY = "attendai_auth";

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.user) return parsed;
    }
  } catch {}
  return { token: null, user: null };
}

export function setStoredAuth(token, user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const { token } = getStoredAuth();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(
      "Service temporarily unavailable, try again",
      503,
      { detail: err.message }
    );
  }

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    let msg = "Request failed";
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        msg = data.detail;
      } else if (Array.isArray(data.detail)) {
        msg = data.detail
          .map((d) => (typeof d === "object" ? d.msg || d.message || JSON.stringify(d) : String(d)))
          .join("; ");
      } else if (data.detail && typeof data.detail === "object") {
        msg = data.detail.msg || data.detail.message || JSON.stringify(data.detail);
      } else if (typeof data.message === "string") {
        msg = data.message;
      } else {
        msg = JSON.stringify(data);
      }
    } else if (typeof data === "string" && data.trim()) {
      msg = data;
    }

    if (res.status === 401 && !path.startsWith("/auth/") && !path.startsWith("/attendance/")) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent("attendai:unauthorized"));
    }

    throw new ApiError(msg, res.status, data);
  }

  return data;
}

export const api = {
  // Auth
  login: async (body) => {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify(body) });
    return {
      ...data,
      token: data.access_token || data.token,
    };
  },
  register: async (body) => {
    const data = await request("/auth/register", { method: "POST", body: JSON.stringify(body) });
    return {
      ...data,
      token: data.access_token || data.token,
    };
  },

  // Teacher endpoints
  getTeacherProfile: () => request("/teachers/me"),

  // Student endpoints
  getStudentProfile: async () => {
    const data = await request("/students/me");
    const face = Boolean(data?.face_registered ?? data?.has_face_registered);
    const voice = Boolean(data?.voice_registered ?? data?.has_voice_registered);
    return {
      ...data,
      face_registered: face,
      has_face_registered: face,
      voice_registered: voice,
      has_voice_registered: voice,
    };
  },
  getBiometricStatus: async () => {
    const data = await request("/students/me/biometrics");
    const face = Boolean(data?.face_registered ?? data?.has_face_registered);
    const voice = Boolean(data?.voice_registered ?? data?.has_voice_registered);
    return {
      face_registered: face,
      has_face_registered: face,
      voice_registered: voice,
      has_voice_registered: voice,
    };
  },
  enrollFace: (file) => {
    const fd = new FormData();
    fd.append("file", file, "face_capture.jpg");
    return request("/students/enroll-face", { method: "POST", body: fd });
  },
  enrollVoice: (file) => {
    const fd = new FormData();
    const ext = file.type && file.type.includes("webm") ? "webm" : file.type && file.type.includes("ogg") ? "ogg" : "wav";
    fd.append("file", file, `voice_sample.${ext}`);
    return request("/students/enroll-voice", { method: "POST", body: fd });
  },

  // Classes
  getClasses: async () => {
    const list = await request("/classes/");
    return (list || []).map((c) => ({
      ...c,
      id: c.class_id ?? c.id,
      class_id: c.class_id ?? c.id,
    }));
  },
  createClass: (body) =>
    request("/classes/", { method: "POST", body: JSON.stringify(body) }),
  joinClass: (body) =>
    request("/classes/join", { method: "POST", body: JSON.stringify(body) }),
  getClassStudents: async (classId) => {
    const list = await request(`/classes/${classId}/students`);
    return (list || []).map((s) => ({
      ...s,
      id: s.student_id ?? s.id,
      student_id: s.student_id ?? s.id,
      face_registered: s.has_face_registered ?? s.face_registered ?? false,
      voice_registered: s.has_voice_registered ?? s.voice_registered ?? false,
    }));
  },

  // Attendance
  markManual: (body) => {
    const payload = {
      ...body,
      attendance_date: body.attendance_date || body.date,
      date: body.attendance_date || body.date,
    };
    return request("/attendance/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  markPhoto: (classId, file) => {
    if (!classId) throw new ApiError("Please select an enrolled class before verifying.", 400);
    const fd = new FormData();
    fd.append("class_id", String(classId));
    fd.append("file", file, "attendance_photo.jpg");
    return request("/attendance/photo", { method: "POST", body: fd });
  },
  markVoice: (classId, file) => {
    if (!classId) throw new ApiError("Please select an enrolled class before verifying.", 400);
    const fd = new FormData();
    fd.append("class_id", String(classId));
    const ext = file.type && file.type.includes("webm") ? "webm" : file.type && file.type.includes("ogg") ? "ogg" : "wav";
    fd.append("file", file, `attendance_voice.${ext}`);
    return request("/attendance/voice", { method: "POST", body: fd });
  },
  getHistory: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.class_id && params.class_id !== "all") qs.set("class_id", params.class_id);
    if (params.date) qs.set("date", params.date);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    const list = await request(`/attendance/history${query}`);
    return (list || []).map((r) => ({
      ...r,
      id: r.attendance_id ?? r.id,
      attendance_id: r.attendance_id ?? r.id,
    }));
  },
  getStats: async (classId) => {
    const qs = classId && classId !== "all" ? `?class_id=${classId}` : "";
    const data = await request(`/attendance/stats${qs}`);
    const total = data?.total_sessions ?? data?.total_records ?? 0;
    const rate = data?.attendance_rate ?? data?.attendance_percentage ?? 0;
    return {
      ...data,
      total_records: total,
      total_sessions: total,
      attendance_percentage: rate,
      attendance_rate: rate,
      present_count: data?.present_count ?? 0,
      absent_count: data?.absent_count ?? 0,
      late_count: data?.late_count ?? 0,
    };
  },
};
