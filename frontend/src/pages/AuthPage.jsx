import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AuthPage({ initialTab = "login", initialRole = "student" }) {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || initialTab;
  const defaultRole = searchParams.get("role") || initialRole;

  const [tab, setTab] = useState(defaultTab === "signup" ? "signup" : "login");
  const [role, setRole] = useState(defaultRole === "teacher" ? "teacher" : "student");

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  const { login } = useAuth();

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    return { score, label: labels[score] || "Weak" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner("");

    if (!username.trim()) {
      setErrorBanner("Please enter your username.");
      return;
    }
    if (!password) {
      setErrorBanner("Please enter your password.");
      return;
    }
    if (tab === "signup" && !fullName.trim()) {
      setErrorBanner("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        const res = await api.login({
          username: username.trim(),
          password,
          role,
        });
        const token = res.token || res.access_token;
        toast.success(`Welcome back, ${res.user.name || res.user.username}!`);
        login(token, res.user);
      } else {
        const res = await api.register({
          name: fullName.trim(),
          username: username.trim(),
          password,
          role,
        });
        const token = res.token || res.access_token;
        toast.success("Account created successfully!");
        login(token, res.user);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let message = err.message || "An unexpected error occurred.";
      if (err.status === 401) {
        message = "Invalid username or password";
      } else if (err.status === 409) {
        message = "Username is already taken";
      } else if (err.status === 503) {
        message = "Service temporarily unavailable, try again";
      }
      setErrorBanner(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-surface overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-fixed opacity-40 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary-fixed opacity-30 blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="w-full z-20 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-on-surface font-headline-sm hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
          </div>
          <span className="font-bold tracking-tight">AttendAI</span>
        </Link>
        <Link
          to="/"
          className="text-on-surface-variant hover:text-on-surface text-body-sm font-medium flex items-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8 z-10">
        <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 border border-outline-variant/30">
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md mb-3">
              <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
            </div>
            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
              Intelligent Classroom Attendance
            </span>
            <h1 className="font-headline-md text-on-surface">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h1>
          </div>

          {/* Mode Switcher: Log In vs Sign Up */}
          <div className="grid grid-cols-2 gap-1 bg-surface-container-low p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorBanner("");
              }}
              className={`py-2 px-3 rounded-lg font-label-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === "login"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Log in</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorBanner("");
              }}
              className={`py-2 px-3 rounded-lg font-label-lg transition-all flex items-center justify-center gap-1.5 ${
                tab === "signup"
                  ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Sign up</span>
            </button>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-md text-on-surface">Select your role</span>
              <span className="font-label-sm text-primary font-medium">Required</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-label-lg transition-all ${
                  role === "student"
                    ? "bg-primary-container text-on-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-label-lg transition-all ${
                  role === "teacher"
                    ? "bg-primary-container text-on-primary shadow-sm font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">co_present</span>
                <span>Teacher</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="rounded-xl bg-error-container text-on-error-container p-3.5 mb-5 flex items-start gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <div className="flex-1 min-w-0">
                <p className="font-body-sm font-medium">{errorBanner}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner("")}
                className="text-on-error-container opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "signup" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-on-surface" htmlFor="signup-fullname">
                    Full name
                  </label>
                  <span className="font-label-sm text-on-surface-variant">
                    {fullName.length} / 120
                  </span>
                </div>
                <input
                  id="signup-fullname"
                  type="text"
                  maxLength={120}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === "teacher" ? "e.g. Dr. Elena Rostova" : "e.g. Maya Lin"}
                  className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border border-transparent focus:border-primary"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-on-surface" htmlFor="username-input">
                Username
              </label>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "teacher" ? "e.g. elena.rostova" : "e.g. maya.lin"}
                className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border border-transparent focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-on-surface" htmlFor="password-input">
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "signup" ? "Create a strong password" : "Enter your password"}
                  className="w-full h-11 pl-3.5 pr-11 rounded-lg bg-surface-container-low text-on-surface font-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all border border-transparent focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {tab === "signup" && (
                <>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          strength.score >= step
                            ? step <= 2
                              ? "bg-error"
                              : step === 3
                              ? "bg-secondary"
                              : "bg-primary"
                            : "bg-surface-container-high"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant mt-0.5">
                    <span>At least 8 characters</span>
                    {strength.label && (
                      <span className="font-label-sm font-semibold">{strength.label}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-lg bg-primary-container text-on-primary font-label-lg hover:bg-primary shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === "login" ? "Log in" : "Create account"}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center">
            <p className="font-body-sm text-on-surface-variant text-[12px]">
              Your biometric profiles (face &amp; voice) are stored as encrypted numeric embeddings, never raw media files.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center font-body-sm text-on-surface-variant text-[13px] z-10">
        © 2025 AttendAI. Educational SaaS Precision.
      </footer>
    </div>
  );
}
