import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import TeacherPortal from "./pages/TeacherPortal";
import StudentPortal from "./pages/StudentPortal";

function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return children;
}

function PublicAuthRoute() {
  const { user, token } = useAuth();
  if (token && user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "12px",
            padding: "12px 18px",
            fontSize: "14px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          },
          success: {
            iconTheme: { primary: "#059669", secondary: "#ECFDF5" },
          },
          error: {
            iconTheme: { primary: "#E11D48", secondary: "#FFF1F2" },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<PublicAuthRoute />} />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute role="teacher">
              <TeacherPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute role="student">
              <StudentPortal />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
