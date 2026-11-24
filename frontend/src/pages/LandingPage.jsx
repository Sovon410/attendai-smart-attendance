import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user, token } = useAuth();
  const [previewMode, setPreviewMode] = useState("photo"); // 'photo' | 'voice'
  const [overrideStatus, setOverrideStatus] = useState("Present"); // 'Present' | 'Late' | 'Absent'

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-headline-sm text-on-surface tracking-tight">
            <span className="material-symbols-outlined text-primary-container text-[26px]">face</span>
            <span className="font-bold">AttendAI</span>
          </Link>
          <div className="flex items-center gap-3">
            {token && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user.role === "teacher" ? "/teacher" : "/student"}
                  className="px-4 py-2 rounded-lg font-label-lg bg-primary-container text-on-primary hover:bg-primary transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Open {user.role === "teacher" ? "Teacher Portal" : "Student Portal"}</span>
                </Link>
              </div>
            ) : (
              <nav className="flex items-center gap-2">
                <Link
                  to="/auth?tab=login"
                  className="px-4 py-2 rounded-lg font-label-lg text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low hover:text-on-surface transition-colors border border-outline-variant/40"
                >
                  Log in
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="px-4 py-2 rounded-lg font-label-lg bg-primary-container text-on-primary hover:bg-primary transition-colors shadow-sm"
                >
                  Create account
                </Link>
              </nav>
            )}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-16 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden py-16 lg:py-24">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-fixed/40 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Typography & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-on-primary-fixed-variant font-label-md mb-6 border border-outline-variant/40">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>Face &amp; Voice Attendance</span>
              </div>
              <h1 className="font-display-lg text-on-surface tracking-tight mb-6">
                Attendance by face or voice, verified in seconds.
              </h1>
              <p className="font-body-lg text-on-surface-variant mb-8 max-w-xl">
                Students verify themselves with a live photo or a short voice clip; teachers create classes, see live rosters, and can override any record instantly.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/auth?tab=signup"
                  className="px-6 py-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-md hover:bg-primary transition-all hover:-translate-y-0.5"
                >
                  Create account
                </Link>
                <Link
                  to="/auth?tab=login"
                  className="px-6 py-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg shadow-sm hover:bg-surface-container-low transition-all border border-outline-variant/40"
                >
                  Log in
                </Link>
              </div>
            </div>

            {/* Right: Interactive Verification Preview */}
            <div className="lg:col-span-6 relative">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xl border border-outline-variant/30">
                {/* Mode Switcher */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-[22px]">verified_user</span>
                    <span className="font-title-md text-on-surface">Live Check-in Preview</span>
                  </div>
                  <div className="inline-flex p-1 rounded-lg bg-surface-container-low">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("photo")}
                      className={`px-3 py-1.5 rounded-md font-label-md transition-colors ${
                        previewMode === "photo"
                          ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("voice")}
                      className={`px-3 py-1.5 rounded-md font-label-md transition-colors ${
                        previewMode === "voice"
                          ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Voice
                    </button>
                  </div>
                </div>

                {/* Photo Mode Preview */}
                {previewMode === "photo" ? (
                  <div className="relative rounded-xl overflow-hidden bg-inverse-surface aspect-[16/10] flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover opacity-85"
                      alt="Student smiling in modern classroom"
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/85 via-transparent to-transparent"></div>

                    {/* Simulated Bounding Box */}
                    <div className="absolute inset-x-1/4 inset-y-6 rounded-xl shadow-[0_0_0_2px_rgba(102,22,215,0.9)] pointer-events-none">
                      <div className="absolute -top-3.5 left-3 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary font-label-sm flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
                        <span>Maya Lin · 99.1% Face Match</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-inverse-on-surface">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary-fixed text-[20px]">check_circle</span>
                        <span className="font-label-lg font-semibold">Marked Present</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-md font-label-sm">
                        CS-204 · 09:02 AM
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Voice Mode Preview */
                  <div className="relative rounded-xl overflow-hidden bg-surface-container-low aspect-[16/10] flex flex-col items-center justify-center p-8 text-center border border-outline-variant/30">
                    <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-4 text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[32px]">mic</span>
                    </div>
                    <p className="font-title-md text-on-surface mb-2 font-bold">“Present for CS-204”</p>
                    <p className="font-body-sm text-on-surface-variant mb-6">
                      Short voice clip matched against enrolled voice profile
                    </p>

                    {/* SVG Waveform Visualizer */}
                    <div className="flex items-center justify-center gap-1.5 h-12 text-primary-container">
                      {[14, 28, 20, 42, 24, 34, 16, 38, 26, 44, 20, 30, 14, 24, 16, 8].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}px` }}
                          className="w-1.5 rounded-full bg-primary-container transition-all"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Three Core Capabilities Cards */}
        <section className="w-full py-16 lg:py-20 bg-surface-container-low border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="font-label-md uppercase tracking-wider text-primary-container block mb-2 font-semibold">
                  Core Capabilities
                </span>
                <h2 className="font-headline-lg text-on-surface">Built for fast classroom transitions</h2>
              </div>
              <p className="font-body-md text-on-surface-variant max-w-md">
                Flexible verification for students and complete roster authority for teachers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Photo check-in */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-5 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                  </div>
                  <h3 className="font-headline-sm text-on-surface mb-2">Photo check-in</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Students take a quick live photo on their device to verify facial identity in seconds.
                  </p>
                </div>
                <div className="mt-6 pt-4 flex items-center gap-2 text-primary-container font-label-md font-semibold border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Live camera verification</span>
                </div>
              </div>

              {/* Card 2: Voice check-in */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container mb-5 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">mic</span>
                  </div>
                  <h3 className="font-headline-sm text-on-surface mb-2">Voice check-in</h3>
                  <p className="font-body-md text-on-surface-variant">
                    Students speak a short phrase to check in hands-free when a camera isn’t preferred.
                  </p>
                </div>
                <div className="mt-6 pt-4 flex items-center gap-2 text-secondary font-label-md font-semibold border-t border-outline-variant/20">
                  <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                  <span>Short voice clip match</span>
                </div>
              </div>

              {/* Card 3: Teacher control */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-outline-variant/30">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant mb-5 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">edit_note</span>
                  </div>
                  <h3 className="font-headline-sm text-on-surface mb-2">Teacher control</h3>
                  <p className="font-body-md text-on-surface-variant mb-5">
                    Review live class rosters and manually override any student’s status at any time.
                  </p>
                </div>

                {/* Interactive Override Demo */}
                <div className="bg-surface-container-low rounded-lg p-1.5 flex items-center justify-between gap-1 border border-outline-variant/30">
                  {["Present", "Late", "Absent"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOverrideStatus(s)}
                      className={`flex-1 py-1.5 px-2 rounded-md font-label-md transition-all ${
                        overrideStatus === s
                          ? s === "Present"
                            ? "bg-secondary-container text-on-secondary-container font-semibold shadow-sm"
                            : s === "Late"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold shadow-sm"
                            : "bg-error-container text-on-error-container font-semibold shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step How It Works */}
        <section className="w-full py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="mb-12">
              <span className="font-label-md uppercase tracking-wider text-primary-container block mb-2 font-semibold">
                How It Works
              </span>
              <h2 className="font-headline-lg text-on-surface">Four steps from setup to daily check-in</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: "01",
                  title: "Create account",
                  desc: "Sign up and pick your role as either a Student or a Teacher.",
                },
                {
                  num: "02",
                  title: "Share class code",
                  desc: "Teacher creates a class and shares the 6-character code (e.g. K7M2QX).",
                },
                {
                  num: "03",
                  title: "Enroll once",
                  desc: "Student joins the class with the code and enrolls their face and voice once.",
                },
                {
                  num: "04",
                  title: "Verify each day",
                  desc: "Student checks in each day with a live photo or short voice clip.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between"
                >
                  <span className="font-headline-lg text-primary-fixed-dim block mb-4 font-bold">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-title-md text-on-surface mb-2 font-semibold">{step.title}</h3>
                    <p className="font-body-sm text-on-surface-variant">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Note Banner */}
        <section className="w-full pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="bg-surface-container rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-outline-variant/40 shadow-sm">
              <div className="flex items-start gap-5 max-w-2xl">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-sm border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[26px]">shield_lock</span>
                </div>
                <div>
                  <span className="font-label-md uppercase tracking-wider text-primary-container block mb-1 font-semibold">
                    Privacy by Design
                  </span>
                  <p className="font-headline-sm text-on-surface font-semibold">
                    Your face and voice are stored as numeric profiles (embeddings), not as photos or recordings.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/auth?tab=signup"
                  className="px-6 py-3 rounded-lg bg-primary-container text-on-primary font-label-lg hover:bg-primary transition-colors shadow-sm"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-8 border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-on-surface-variant font-body-sm text-[13px]">
          <p>Your face and voice are stored as numeric profiles (embeddings), not as photos or recordings.</p>
          <p>© 2025 AttendAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
