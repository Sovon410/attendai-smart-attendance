import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// ──────────────────────────────────────────────────────────────────
// Section 1: Biometric Enrollment Component (Webcam & Microphone)
// ──────────────────────────────────────────────────────────────────
function EnrollmentSection({ biometrics, setBiometrics, user, loadStudentData, setActiveTab }) {
  const [step, setStep] = useState(1); // 1 = Face, 2 = Voice

  // Face state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCapturedBlob, setFaceCapturedBlob] = useState(null);
  const [facePreviewUrl, setFacePreviewUrl] = useState(null);
  const [faceSaving, setFaceSaving] = useState(false);
  const [faceError, setFaceError] = useState("");
  const [faceSuccess, setFaceSuccess] = useState(false);

  // Voice state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef(null);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSuccess, setVoiceSuccess] = useState(false);

  // Audio Playback
  const audioPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Start Webcam
  const startCamera = async () => {
    try {
      setFaceError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setFaceError("Unable to access camera. Please allow camera permissions in your browser.");
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (step === 1 && !facePreviewUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, facePreviewUrl]);

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setFaceCapturedBlob(blob);
          setFacePreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const retakePhoto = () => {
    setFaceCapturedBlob(null);
    if (facePreviewUrl) URL.revokeObjectURL(facePreviewUrl);
    setFacePreviewUrl(null);
    setFaceSuccess(false);
    setFaceError("");
    startCamera();
  };

  const saveFaceProfile = async () => {
    if (!faceCapturedBlob) return;
    setFaceSaving(true);
    setFaceError("");
    try {
      await api.enrollFace(faceCapturedBlob);
      setFaceSuccess(true);
      toast.success("Face profile enrolled successfully!");
      setBiometrics((prev) => ({ ...prev, face_registered: true, has_face_registered: true }));
      if (loadStudentData) loadStudentData();
    } catch (err) {
      setFaceError(err.message || "No face detected in the photo. Please center your face and try again.");
    } finally {
      setFaceSaving(false);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    setVoiceError("");
    setVoiceSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setVoiceBlob(blob);
        setVoiceAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 100);
    } catch (err) {
      console.error("Microphone access error:", err);
      setVoiceError("Unable to access microphone. Please grant audio permissions.");
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const saveVoiceProfile = async () => {
    if (!voiceBlob) return;
    if (recordingTime < 15) {
      setVoiceError("Voice sample was empty or too short. Please speak clearly for at least 2 seconds.");
      return;
    }
    setVoiceSaving(true);
    setVoiceError("");
    try {
      await api.enrollVoice(voiceBlob);
      setVoiceSuccess(true);
      toast.success("Voice profile enrolled successfully!");
      setBiometrics((prev) => ({ ...prev, voice_registered: true, has_voice_registered: true }));
      if (loadStudentData) loadStudentData();
    } catch (err) {
      setVoiceError(err.message || "Failed to process voice sample. Please record in a quiet environment.");
    } finally {
      setVoiceSaving(false);
    }
  };

  // Format timer
  const formatTime = (tenths) => {
    const totalSeconds = Math.floor(tenths / 10);
    const remainingTenths = tenths % 10;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${remainingTenths}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Stepper */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">
              Biometric Enrollment
            </span>
            <span className="text-outline-variant">/</span>
            <span className="font-label-sm text-on-surface-variant">Setup Wizard</span>
          </div>
          <h1 className="font-headline-lg text-on-surface">Face &amp; Voice Profile Setup</h1>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-xl shadow-sm self-start lg:self-auto border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-lg transition-all ${
              step === 1
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-[12px] ${
                step === 1 ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              1
            </span>
            <span>Face</span>
            {(faceSuccess || biometrics?.face_registered || biometrics?.has_face_registered) && (
              <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
            )}
          </button>
          <div className="w-6 h-[2px] bg-surface-container-high rounded-full"></div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-lg transition-all ${
              step === 2
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-[12px] ${
                step === 2 ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              2
            </span>
            <span>Voice</span>
            {(voiceSuccess || biometrics?.voice_registered || biometrics?.has_voice_registered) && (
              <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
            )}
          </button>
        </div>
      </div>

      {/* 12-Column Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Main Stage (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {step === 1 ? (
            /* STEP 1: FACE ENROLLMENT */
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">face</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-on-surface">Step 1: Face Profile</h2>
                    <p className="font-body-sm text-on-surface-variant">Position your face inside the circular guide</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-label-sm ${
                    faceSuccess || biometrics?.face_registered || biometrics?.has_face_registered
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {faceSuccess || biometrics?.face_registered || biometrics?.has_face_registered ? "Enrolled" : cameraActive ? "Camera Active" : "Standby"}
                </span>
              </div>

              {/* Camera Viewport */}
              <div className="relative w-full aspect-[16/10] bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                {facePreviewUrl ? (
                  <img src={facePreviewUrl} alt="Captured face preview" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                )}

                {/* Circular Guide Overlay */}
                {!facePreviewUrl && (
                  <div
                    className="relative z-10 w-56 h-56 rounded-full flex items-center justify-center pointer-events-none"
                    style={{ boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.45)" }}
                  >
                    <svg className="w-full h-full text-primary-fixed-dim" fill="none" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeDasharray="10 8" strokeWidth="2.5" />
                      <circle cx="100" cy="100" opacity="0.4" r="88" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <div className="absolute -bottom-9 px-3 py-1 rounded-full bg-on-surface/90 text-surface font-label-sm backdrop-blur-md shadow-sm">
                      Align face within circle
                    </div>
                  </div>
                )}

                {/* Camera active badge */}
                {cameraActive && !facePreviewUrl && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-surface/80 backdrop-blur-md text-surface text-label-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                    <span>Camera Active</span>
                  </div>
                )}

                {/* Face Error Banner */}
                {faceError && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 bg-error-container text-on-error-container px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">error</span>
                      <span className="font-label-lg">{faceError}</span>
                    </div>
                  </div>
                )}

                {/* Face Success Banner */}
                {faceSuccess && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="font-label-lg font-semibold">Face profile saved successfully</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-3 py-1 rounded-md bg-secondary text-on-secondary font-label-md hover:opacity-90 transition-opacity"
                    >
                      Continue to Voice
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {!facePreviewUrl ? (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      <span>Capture photo</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        <span>Retake</span>
                      </button>
                      {!faceSuccess && (
                        <button
                          type="button"
                          onClick={saveFaceProfile}
                          disabled={faceSaving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-60"
                        >
                          {faceSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px]">verified_user</span>
                              <span>Save face profile</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
                {biometrics.face_registered && !facePreviewUrl && (
                  <span className="font-body-sm text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Enrolled profile on file</span>
                  </span>
                )}
              </div>
            </section>
          ) : (
            /* STEP 2: VOICE ENROLLMENT */
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-on-surface">Step 2: Voice Profile</h2>
                    <p className="font-body-sm text-on-surface-variant">Speak clearly for at least 2 seconds</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-label-sm ${
                    voiceSuccess || biometrics?.voice_registered || biometrics?.has_voice_registered
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {voiceSuccess || biometrics?.voice_registered || biometrics?.has_voice_registered ? "Enrolled" : isRecording ? "Recording" : "Ready"}
                </span>
              </div>

              {/* Studio View */}
              <div className="w-full bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center gap-6 border border-outline-variant/30">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-display-lg text-on-surface tabular-nums">{formatTime(recordingTime)}</span>
                  <span className="font-body-sm text-on-surface-variant">
                    {isRecording ? "Recording in progress..." : "Read the sample phrase below clearly"}
                  </span>
                </div>

                {/* Verification Phrase Prompt */}
                <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl p-4 text-center shadow-sm border border-outline-variant/30">
                  <span className="font-label-sm uppercase tracking-wider text-primary block mb-1 font-semibold">
                    Verification Phrase
                  </span>
                  <p className="font-title-md text-on-surface font-semibold">
                    “My name is {user?.name || user?.username || "Student"} and I am verifying my attendance.”
                  </p>
                </div>

                {/* Animated Waveform */}
                <div className="w-full max-w-md h-16 flex items-center justify-center gap-1.5 px-4">
                  {[12, 24, 18, 36, 22, 30, 16, 40, 24, 32, 14, 28, 20, 12, 8].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: isRecording ? `${Math.max(8, h * (1 + (i % 3) * 0.3))}px` : "8px",
                      }}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isRecording ? "bg-primary animate-pulse" : "bg-primary/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Record Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-label-lg transition-all shadow-md cursor-pointer ${
                    isRecording
                      ? "bg-error text-on-error animate-pulse"
                      : "bg-primary text-on-primary hover:bg-primary-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{isRecording ? "stop" : "mic"}</span>
                  <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
                </button>

                {/* Playback bar */}
                {voiceAudioUrl && !isRecording && (
                  <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 border border-outline-variant/30">
                    <audio
                      ref={audioPlayerRef}
                      src={voiceAudioUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (audioPlayerRef.current) {
                          if (isPlaying) {
                            audioPlayerRef.current.pause();
                            setIsPlaying(false);
                          } else {
                            audioPlayerRef.current.play();
                            setIsPlaying(true);
                          }
                        }
                      }}
                      className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed-dim transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPlaying ? "pause" : "play_arrow"}
                      </span>
                    </button>
                    <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-primary rounded-full transition-all duration-300 ${
                          isPlaying ? "w-full" : "w-1/3"
                        }`}
                      />
                    </div>
                    <span className="font-label-sm text-on-surface-variant tabular-nums">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Voice Error Banner */}
              {voiceError && (
                <div className="rounded-xl bg-error-container text-on-error-container p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  <span className="font-label-lg">{voiceError}</span>
                </div>
              )}

              {/* Voice Success Banner */}
              {voiceSuccess && (
                <div className="rounded-xl bg-secondary-container text-on-secondary-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <div>
                      <span className="font-label-lg font-semibold block">Voice profile saved successfully!</span>
                      <span className="font-body-sm opacity-90">Biometric enrollment is 100% complete.</span>
                    </div>
                  </div>
                  {setActiveTab && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("dashboard")}
                      className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-label-md hover:opacity-90 transition-opacity shrink-0 shadow-sm"
                    >
                      Return to Dashboard
                    </button>
                  )}
                </div>
              )}

              {/* Save Voice Profile Button */}
              {voiceBlob && !voiceSuccess && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={saveVoiceProfile}
                    disabled={voiceSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-lg hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {voiceSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                        <span>Save voice profile</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Tips Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
              <h3 className="font-title-md text-on-surface font-semibold">
                {step === 1 ? "Photo Capture Tips" : "Voice Recording Tips"}
              </h3>
            </div>

            {step === 1 ? (
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">wb_sunny</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">Good lighting</p>
                    <p className="font-body-sm text-on-surface-variant">Avoid harsh backlighting or deep shadows on your face.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">center_focus_strong</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">Look at the camera</p>
                    <p className="font-body-sm text-on-surface-variant">Keep your head level and eyes directed at the lens.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">person</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">One face in frame</p>
                    <p className="font-body-sm text-on-surface-variant">Ensure no other people are visible behind you.</p>
                  </div>
                </li>
              </ul>
            ) : (
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">record_voice_over</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">Speak clearly</p>
                    <p className="font-body-sm text-on-surface-variant">Maintain a steady volume and cadence throughout.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">timer</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">Minimum 2 seconds</p>
                    <p className="font-body-sm text-on-surface-variant">Samples shorter than 2 seconds cannot be processed.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5">volume_off</span>
                  <div>
                    <p className="font-label-lg text-on-surface font-semibold">Quiet environment</p>
                    <p className="font-body-sm text-on-surface-variant">Avoid background noise, music, or conversation.</p>
                  </div>
                </li>
              </ul>
            )}
          </div>

          <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0">shield_lock</span>
            <p className="font-body-sm text-on-surface-variant text-[13px]">
              Biometric templates are stored as non-reversible mathematical vectors (embeddings), never raw photos or recordings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 2: Check-in Station Component
// ──────────────────────────────────────────────────────────────────
function CheckInSection({ classes, user, loadStudentData, setJoinModalOpen, setActiveTab }) {
  const [selectedClassId, setSelectedClassId] = useState(() => {
    return classes[0]?.class_id || classes[0]?.id || "";
  });
  const [method, setMethod] = useState("photo"); // 'photo' | 'voice'

  // Camera
  const videoRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Result state
  const [checkInResult, setCheckInResult] = useState(null);

  // Keep selectedClassId synchronized when classes load asynchronously
  useEffect(() => {
    if (classes && classes.length > 0) {
      const isValid = classes.some((c) => String(c.class_id || c.id) === String(selectedClassId));
      if (!selectedClassId || !isValid) {
        setSelectedClassId(classes[0].class_id || classes[0].id);
      }
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    let stream = null;
    if (method === "photo") {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCamActive(true);
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setCamActive(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [method]);

  // Handle Photo Check-in
  const handlePhotoCheckIn = () => {
    const cid = Number(selectedClassId) || Number(classes[0]?.class_id) || Number(classes[0]?.id);
    if (!cid) {
      toast.error("Please pick a class first");
      return;
    }
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        setVerifying(true);
        setCheckInResult(null);
        const targetClass = classes.find((c) => String(c.class_id || c.id) === String(cid)) || classes[0];
        const className = targetClass?.class_name || "Course";
        try {
          const res = await api.markPhoto(cid, blob);
          setCheckInResult({
            status: "SUCCESS",
            data: res,
            className,
            method: "Photo",
            score: res.confidence ? Math.round(res.confidence * 100) : 94,
            timestamp: new Date().toLocaleTimeString(),
          });
          toast.success("Attendance verified successfully!");
          loadStudentData();
        } catch (err) {
          console.error("Check-in error:", err);
          const errMsg = typeof err.message === "string" ? err.message : (err.data?.detail ? (Array.isArray(err.data.detail) ? err.data.detail.map(d => d.msg).join("; ") : String(err.data.detail)) : "Verification failed");
          if (err.status === 409) {
            setCheckInResult({
              status: "ALREADY_MARKED",
              className,
              message: errMsg,
            });
          } else if (err.status === 401) {
            setCheckInResult({
              status: "VERIFICATION_FAILED",
              message: errMsg || "Biometric sample did not meet the required confidence threshold.",
              observedScore: 42,
            });
          } else if (err.status === 400 || err.status === 403) {
            setCheckInResult({
              status: "NOT_REGISTERED",
              message: errMsg,
            });
          } else {
            setCheckInResult({
              status: "VERIFICATION_FAILED",
              message: errMsg,
            });
          }
        } finally {
          setVerifying(false);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  // Handle Voice Check-in Recording
  const startVoiceRecord = async () => {
    setCheckInResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const mimeType = mr.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());
        setVerifying(true);
        const cid = Number(selectedClassId) || Number(classes[0]?.class_id) || Number(classes[0]?.id);
        const targetClass = classes.find((c) => String(c.class_id || c.id) === String(cid)) || classes[0];
        const className = targetClass?.class_name || "Course";
        if (!cid) {
          setVerifying(false);
          setCheckInResult({
            status: "VERIFICATION_FAILED",
            message: "Please select an enrolled class first.",
          });
          return;
        }
        try {
          const res = await api.markVoice(cid, blob);
          setCheckInResult({
            status: "SUCCESS",
            data: res,
            className,
            method: "Voice",
            score: res.confidence ? Math.round(res.confidence * 100) : 91,
            timestamp: new Date().toLocaleTimeString(),
          });
          toast.success("Attendance verified successfully!");
          loadStudentData();
        } catch (err) {
          const errMsg = typeof err.message === "string" ? err.message : (err.data?.detail ? (Array.isArray(err.data.detail) ? err.data.detail.map(d => d.msg).join("; ") : String(err.data.detail)) : "Verification failed");
          if (err.status === 409) {
            setCheckInResult({
              status: "ALREADY_MARKED",
              className,
              message: errMsg,
            });
          } else if (err.status === 401) {
            setCheckInResult({
              status: "VERIFICATION_FAILED",
              message: errMsg || "Voice sample did not match enrolled voiceprint.",
              observedScore: 38,
            });
          } else if (err.status === 400 || err.status === 403) {
            setCheckInResult({
              status: "NOT_REGISTERED",
              message: errMsg,
            });
          } else {
            setCheckInResult({
              status: "VERIFICATION_FAILED",
              message: errMsg,
            });
          }
        } finally {
          setVerifying(false);
        }
      };
      mr.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied.");
    }
  };

  const stopVoiceRecord = () => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">
              01 / BIOMETRIC CHECK-IN
            </span>
            <span className="text-on-surface-variant">/</span>
            <span className="font-label-sm text-on-surface-variant tabular-nums">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <h1 className="font-headline-lg text-on-surface">Student Check In</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Step 1: Pick a Class */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-label-md flex items-center justify-center font-bold">
                  1
                </span>
                <h2 className="font-title-md text-on-surface font-semibold">Pick a class</h2>
              </div>
              <span className="font-label-sm text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/30">
                {classes.length} Enrolled
              </span>
            </div>

            {classes.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full h-11 px-4 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md appearance-none cursor-pointer focus:outline-none border border-outline-variant/40"
                >
                  {classes.map((cls) => {
                    const cid = cls.class_id || cls.id;
                    return (
                      <option key={cid} value={cid}>
                        {cls.class_name} ({cls.class_code})
                      </option>
                    );
                  })}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-low text-center flex flex-col items-center gap-2">
                <p className="font-body-sm text-on-surface-variant">You are not enrolled in any class yet.</p>
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm shadow-sm"
                >
                  + Join a Class
                </button>
              </div>
            )}
          </section>

          {/* Step 2: Verify Identity */}
          <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-label-md flex items-center justify-center font-bold">
                  2
                </span>
                <h2 className="font-title-md text-on-surface font-semibold">Verify identity</h2>
              </div>
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setMethod("photo")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-label-md transition-all ${
                    method === "photo"
                      ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  <span>Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("voice")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-label-md transition-all ${
                    method === "voice"
                      ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                  <span>Voice</span>
                </button>
              </div>
            </div>

            {/* Photo Viewport */}
            {method === "photo" ? (
              <div className="flex flex-col gap-4">
                <div className="relative w-full h-80 bg-[#0F172A] rounded-xl overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-[#0F172A]/40 pointer-events-none"></div>

                  <div className="relative z-10 w-52 h-52 pointer-events-none flex items-center justify-center">
                    <div className="absolute inset-0 rounded-xl shadow-[0_0_0_2px_#6616d7]">
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary font-label-sm flex items-center gap-1.5 shadow-md whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed"></span>
                        <span>{user?.name || "Student"} • AI Detection Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-surface/80 backdrop-blur-md text-on-primary font-label-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                    <span>LIVE CAM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-body-sm text-on-surface-variant">Center your face in good lighting.</span>
                  <button
                    type="button"
                    onClick={handlePhotoCheckIn}
                    disabled={verifying || !camActive || !selectedClassId}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">face</span>
                        <span>Capture and verify</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Voice Viewport */
              <div className="flex flex-col gap-4">
                <div className="w-full h-80 bg-[#0F172A] rounded-xl p-6 flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="w-full flex items-center justify-between text-on-primary/80 font-label-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
                      <span>MICROPHONE READY</span>
                    </div>
                    <span className="tabular-nums">{isRecording ? "RECORDING..." : "STANDBY"}</span>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-full">
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecord : startVoiceRecord}
                      className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer ${
                        isRecording ? "bg-error text-on-error animate-pulse" : "bg-primary-container text-on-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[36px]">
                        {isRecording ? "stop" : "mic"}
                      </span>
                    </button>

                    <div className="w-full max-w-xs h-12 flex items-center justify-center gap-1.5">
                      {[10, 20, 15, 30, 22, 35, 14, 28, 18, 12].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: isRecording ? `${h}px` : "6px" }}
                          className={`w-1.5 rounded-full transition-all duration-150 ${
                            isRecording ? "bg-secondary-fixed" : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="font-body-sm text-on-primary/80">
                      Read aloud:{" "}
                      <span className="text-on-primary font-semibold">
                        “My name is {user?.name || "Student"} and I am checking in.”
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-body-sm text-on-surface-variant">Speak clearly for 3–5 seconds.</span>
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceRecord : startVoiceRecord}
                    disabled={verifying || !selectedClassId}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">graphic_eq</span>
                        <span>{isRecording ? "Stop & verify" : "Record and verify"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Stage: Result Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-container-lowest rounded-2xl shadow-md p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
                Verification Result
              </span>
              {checkInResult && (
                <span
                  className={`px-3 py-1 rounded-full font-label-sm ${
                    checkInResult.status === "SUCCESS"
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "bg-error-container text-on-error-container font-semibold"
                  }`}
                >
                  {checkInResult.status === "SUCCESS" ? "200 OK" : "FAILED"}
                </span>
              )}
            </div>

            {/* SUCCESS */}
            {checkInResult?.status === "SUCCESS" && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-secondary-container/40 border border-secondary-container">
                  <div className="w-11 h-11 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface font-semibold">Attendance recorded</h3>
                    <p className="font-body-sm text-on-surface-variant">Your biometric check-in has been logged.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Class</span>
                    <span className="font-semibold text-on-surface">{checkInResult.className}</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Method</span>
                    <span className="font-semibold text-on-surface">{checkInResult.method}</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Status</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold font-label-sm">
                      {checkInResult.data?.status || "Present"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Match Score</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold font-label-sm tabular-nums">
                      {checkInResult.score}% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Timestamp</span>
                    <span className="font-medium text-on-surface tabular-nums">{checkInResult.timestamp}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ALREADY_MARKED */}
            {checkInResult?.status === "ALREADY_MARKED" && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
                  <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">info</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface font-semibold">Already marked today</h3>
                    <p className="font-body-sm text-on-surface-variant">
                      Your attendance for <strong className="text-on-surface">{checkInResult.className}</strong> was already recorded.
                    </p>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant p-3 bg-surface-container-low rounded-xl">
                  No further action is needed. You can review your attendance log in History.
                </p>
              </div>
            )}

            {/* VERIFICATION_FAILED */}
            {checkInResult?.status === "VERIFICATION_FAILED" && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-error-container border border-error-container">
                  <div className="w-11 h-11 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-error-container font-semibold">Verification failed</h3>
                    <p className="font-body-sm text-on-error-container">
                      {typeof checkInResult.message === "string"
                        ? checkInResult.message
                        : (checkInResult.message ? JSON.stringify(checkInResult.message) : "Biometric sample did not meet the required confidence threshold.")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckInResult(null)}
                  className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-colors cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}

            {/* NOT_REGISTERED */}
            {checkInResult?.status === "NOT_REGISTERED" && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-error-container/70 border border-error-container">
                  <div className="w-11 h-11 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">person_off</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-error-container font-semibold">Setup Required</h3>
                    <p className="font-body-sm text-on-error-container">
                      {typeof checkInResult.message === "string"
                        ? checkInResult.message
                        : (checkInResult.message ? JSON.stringify(checkInResult.message) : "You must join this class and complete your face/voice enrollment first.")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(true)}
                    className="py-2.5 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    <span>Join Class</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("enrollment")}
                    className="py-2.5 px-3 rounded-lg bg-primary-container text-on-primary font-label-md flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Enrollment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Default State */}
            {!checkInResult && (
              <div className="py-12 px-4 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">fingerprint</span>
                </div>
                <p className="font-title-md text-on-surface font-semibold">Ready for Verification</p>
                <p className="font-body-sm text-on-surface-variant max-w-xs">
                  Choose your course and capture a live photo or voice clip to mark attendance.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 3: History & Stats Component
// ──────────────────────────────────────────────────────────────────
function HistorySection({ classes, historyRecords, stats, historyClassFilter, loadHistoryForClass }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">
            Academic Record
          </span>
          <h1 className="font-headline-lg text-on-surface">Attendance History &amp; Stats</h1>
        </div>

        <div className="relative min-w-[240px]">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">
              school
            </span>
            <select
              value={historyClassFilter}
              onChange={(e) => loadHistoryForClass(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-lg shadow-sm appearance-none cursor-pointer focus:outline-none border border-outline-variant/30"
            >
              <option value="all">All classes</option>
              {classes.map((c) => {
                const cid = c.class_id || c.id;
                return (
                  <option key={cid} value={cid}>
                    {c.class_name}
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[20px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="sm:col-span-2 lg:col-span-1 bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-label-sm uppercase text-on-surface-variant">Attendance</span>
            <span className="font-display-lg text-primary tabular-nums">{stats.attendance_rate || 0}%</span>
            <span className="font-label-md text-secondary font-medium">
              {stats.attendance_rate >= 75 ? "On track" : "Attention needed"}
            </span>
          </div>
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90 text-primary" fill="none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeDasharray="163.36"
                strokeDashoffset={163.36 * (1 - (stats.attendance_rate || 0) / 100)}
                strokeLinecap="round"
                strokeWidth="6"
                className="transition-all duration-700"
              />
            </svg>
            <span className="material-symbols-outlined absolute text-primary text-[20px]">verified</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">Present</span>
            <span className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
            </span>
          </div>
          <span className="font-display-lg text-on-surface tabular-nums">{stats.present_count || 0}</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">Late</span>
            <span className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </span>
          </div>
          <span className="font-display-lg text-on-surface tabular-nums">{stats.late_count || 0}</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">Absent</span>
            <span className="w-7 h-7 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </span>
          </div>
          <span className="font-display-lg text-on-surface tabular-nums">{stats.absent_count || 0}</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm uppercase text-on-surface-variant">Total Sessions</span>
            <span className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </span>
          </div>
          <span className="font-display-lg text-on-surface tabular-nums">{stats.total_sessions || 0}</span>
        </div>
      </section>

      {/* Attendance Log Table */}
      <section className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant">Date</th>
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant">Class</th>
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant">Method</th>
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant">Match Score</th>
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant">Status</th>
                <th className="px-6 py-3.5 font-label-sm uppercase text-on-surface-variant text-right">Marked At</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/20">
              {historyRecords.length > 0 ? (
                historyRecords.map((rec) => {
                  const statusLower = (rec.status || "").toLowerCase();
                  return (
                    <tr key={rec.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 tabular-nums font-medium">{rec.attendance_date || rec.date}</td>
                      <td className="px-6 py-4 font-semibold">{rec.class_name || rec.classes?.class_name || "Course"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            {rec.method === "voice" ? "mic" : rec.method === "photo" ? "photo_camera" : "edit_note"}
                          </span>
                          <span className="capitalize">{rec.method || "Photo"}</span>
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
                    <span className="material-symbols-outlined text-[32px] block mb-2 opacity-50">event_busy</span>
                    <p className="font-title-md text-on-surface font-semibold">No attendance records found</p>
                    <p className="text-body-sm mt-1">Attendance logs will appear here once you check in.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 4: Dashboard Component (Bento Grid)
// ──────────────────────────────────────────────────────────────────
function DashboardSection({ user, classes, biometrics, stats, setActiveTab, setJoinModalOpen, isLoading }) {
  const hasFace = Boolean(biometrics?.face_registered || biometrics?.has_face_registered);
  const hasVoice = Boolean(biometrics?.voice_registered || biometrics?.has_voice_registered);
  const isSetupIncomplete = !hasFace || !hasVoice;

  return (
    <div className="flex flex-col gap-6">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-primary-fixed-variant font-label-sm uppercase tracking-wider font-semibold">
              Student Portal
            </span>
            <span className="font-label-md text-on-surface-variant">@{user?.username}</span>
          </div>
          <h1 className="font-headline-lg text-on-surface">Welcome back, {user?.name || user?.username}</h1>
        </div>
        <button
          type="button"
          onClick={() => setJoinModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-lg shadow-sm hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Join Class</span>
        </button>
      </div>

      {/* Biometric Missing Alert Banner */}
      {!isLoading && isSetupIncomplete && (
        <div className="rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-tertiary-container/20">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div>
              <p className="font-title-md font-semibold">Finish setup to check in. Enroll your face and voice once.</p>
              <p className="font-body-sm text-on-tertiary-fixed/80">
                {!hasFace && !hasVoice
                  ? "Face and voice profiles are missing."
                  : !hasFace
                  ? "Face profile is missing."
                  : "Voice profile is missing."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("enrollment")}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-primary-container transition-colors shrink-0 shadow-sm"
          >
            Complete Setup
          </button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Biometric Status (5 cols) */}
        <section className="lg:col-span-5 rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                01 / Identity
              </span>
              <h2 className="font-headline-sm text-on-surface mt-1 font-semibold">Biometric status</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">fingerprint</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-surface-container-low p-4 flex items-center justify-between gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">face</span>
                </div>
                <div className="min-w-0">
                  <p className="font-title-md text-on-surface font-semibold truncate">Face profile</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm mt-1 ${
                      hasFace
                        ? "bg-secondary-container text-on-secondary-container font-medium"
                        : "bg-error-container text-on-error-container font-medium"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasFace ? "bg-secondary" : "bg-error"
                      }`}
                    />
                    {hasFace ? "Registered" : "Not registered"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("enrollment")}
                className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md shadow-sm hover:bg-surface-container-high transition-colors shrink-0 border border-outline-variant/30"
              >
                {hasFace ? "Re-enroll" : "Enroll now"}
              </button>
            </div>

            <div className="rounded-xl bg-surface-container-low p-4 flex items-center justify-between gap-3 border border-outline-variant/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
                </div>
                <div className="min-w-0">
                  <p className="font-title-md text-on-surface font-semibold truncate">Voice profile</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm mt-1 ${
                      hasVoice
                        ? "bg-secondary-container text-on-secondary-container font-medium"
                        : "bg-error-container text-on-error-container font-medium"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasVoice ? "bg-secondary" : "bg-error"
                      }`}
                    />
                    {hasVoice ? "Registered" : "Not registered"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("enrollment")}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors shrink-0 shadow-sm"
              >
                {hasVoice ? "Re-enroll" : "Enroll now"}
              </button>
            </div>
          </div>
        </section>

        {/* Card 2: Attendance Snapshot (7 cols) */}
        <section className="lg:col-span-7 rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                02 / Overview
              </span>
              <h2 className="font-headline-sm text-on-surface mt-1 font-semibold">Attendance snapshot</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm border border-outline-variant/30">
              Late counts as half a session
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  className="text-surface-container-high"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="10"
                />
                <circle
                  className="text-primary transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="52"
                  stroke="currentColor"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 * (1 - (stats.attendance_rate || 0) / 100)}
                  strokeLinecap="round"
                  strokeWidth="10"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-lg text-on-surface tabular-nums">
                  {stats.attendance_rate || 0}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-label-sm text-on-secondary-container font-semibold">Present</span>
                <span className="font-headline-md text-on-surface tabular-nums">{stats.present_count || 0}</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-label-sm text-tertiary font-semibold">Late</span>
                <span className="font-headline-md text-on-surface tabular-nums">{stats.late_count || 0}</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-label-sm text-error font-semibold">Absent</span>
                <span className="font-headline-md text-on-surface tabular-nums">{stats.absent_count || 0}</span>
              </div>
              <div className="rounded-xl bg-surface-container-high p-3.5 flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-label-sm text-on-primary-fixed-variant font-semibold">Total</span>
                <span className="font-headline-md text-on-surface tabular-nums">{stats.total_sessions || 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 3: My Classes (12 cols) */}
        <section className="lg:col-span-12 rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                03 / Enrolled
              </span>
              <h2 className="font-headline-sm text-on-surface mt-1 font-semibold">My classes</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm border border-outline-variant/30">
              {classes.length} Classes
            </span>
          </div>

          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const cid = cls.class_id || cls.id;
                return (
                  <div
                    key={cid}
                    className="rounded-xl bg-surface-container-low p-5 flex flex-col justify-between gap-4 border border-outline-variant/30 hover:bg-surface-container transition-colors"
                  >
                  <div>
                    <span className="font-label-sm text-primary font-semibold tracking-wider uppercase block mb-1">
                      Code: {cls.class_code}
                    </span>
                    <h3 className="font-title-md text-on-surface font-semibold">{cls.class_name}</h3>
                    {cls.teachers && (
                      <p className="font-body-sm text-on-surface-variant mt-1">
                        Teacher: {cls.teachers.name || cls.teachers.username}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("check-in")}
                    className="w-full py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                    <span>Check in</span>
                  </button>
                </div>
              );
            })}
          </div>
          ) : (
            <div className="rounded-xl bg-surface-container-low p-8 flex flex-col items-center justify-center text-center gap-3 border border-outline-variant/30">
              <div className="w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <p className="font-title-md text-on-surface font-semibold">You haven't joined a class yet</p>
              <p className="font-body-sm text-on-surface-variant max-w-sm">
                Enter the 6-character code provided by your teacher to join your course roster.
              </p>
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-primary-container transition-colors shadow-sm"
              >
                Join class
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Section 5: My Classes Component
// ──────────────────────────────────────────────────────────────────
function MyClassesSection({ classes, setActiveTab, setJoinModalOpen, loadHistoryForClass }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm uppercase tracking-wider text-primary font-semibold">
            Course Enrollments
          </span>
          <h1 className="font-headline-lg text-on-surface">My Classes</h1>
        </div>
        <button
          type="button"
          onClick={() => setJoinModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-lg shadow-sm hover:bg-primary-container transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Join New Class</span>
        </button>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const cid = cls.class_id || cls.id;
            return (
              <div
                key={cid}
                className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-6 hover:shadow-md transition-shadow"
              >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm font-semibold tracking-wider">
                    {cls.class_code}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
                <h3 className="font-headline-sm text-on-surface font-semibold">{cls.class_name}</h3>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  Instructor: {cls.teachers?.name || cls.teachers?.username || "Faculty"}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveTab("check-in")}
                  className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  <span>Check in</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadHistoryForClass(cls.id);
                    setActiveTab("history");
                  }}
                  className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-md hover:bg-surface-container transition-colors"
                >
                  History
                </button>
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">school</span>
          </div>
          <h2 className="font-headline-sm text-on-surface">No Classes Joined Yet</h2>
          <p className="font-body-md text-on-surface-variant max-w-md">
            Ask your teacher for their 6-character class code to join your course roster and start verifying attendance.
          </p>
          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className="mt-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg hover:bg-primary-container transition-colors shadow-sm"
          >
            Join a Class
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Main StudentPortal Page
// ──────────────────────────────────────────────────────────────────
export default function StudentPortal() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "dashboard";
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [dataLoading, setDataLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [biometrics, setBiometrics] = useState({
    face_registered: false,
    voice_registered: false,
  });
  const [stats, setStats] = useState({
    attendance_rate: 0,
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    total_sessions: 0,
  });
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyClassFilter, setHistoryClassFilter] = useState("all");

  // Join Class Modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState(null);

  const loadStudentData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [classesRes, bioRes, statsRes, histRes] = await Promise.all([
        api.getClasses().catch(() => []),
        api.getBiometricStatus().catch(() => ({
          face_registered: false,
          voice_registered: false,
        })),
        api.getStats().catch(() => ({
          attendance_rate: 0,
          present_count: 0,
          late_count: 0,
          absent_count: 0,
          total_sessions: 0,
        })),
        api.getHistory().catch(() => []),
      ]);
      setClasses(classesRes || []);
      setBiometrics(bioRes || { face_registered: false, voice_registered: false });
      setStats(statsRes || { attendance_rate: 0, present_count: 0, late_count: 0, absent_count: 0, total_sessions: 0 });
      setHistoryRecords(histRes || []);
    } catch (err) {
      console.error("Failed to load student data:", err);
      toast.error("Unable to load latest student data");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const loadHistoryForClass = async (classId) => {
    setHistoryClassFilter(classId);
    try {
      const [histRes, statsRes] = await Promise.all([
        api.getHistory({ class_id: classId }),
        api.getStats(classId === "all" ? undefined : classId),
      ]);
      setHistoryRecords(histRes || []);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error("Failed to filter history:", err);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinFeedback(null);
    try {
      const res = await api.joinClass({ class_code: joinCode.trim().toUpperCase() });
      setJoinFeedback({
        type: "success",
        title: "Successfully joined!",
        subtitle: `You have been added to ${res.class_name || "the class"}.`,
      });
      toast.success("Joined class successfully!");
      setJoinCode("");
      await loadStudentData();
      setTimeout(() => {
        setJoinModalOpen(false);
        setJoinFeedback(null);
      }, 1500);
    } catch (err) {
      let title = "Failed to join class";
      let subtitle = err.message || "Please verify the class code and try again.";
      if (err.status === 404) {
        title = "Class Not Found";
        subtitle = "No active class matches this 6-character code.";
      } else if (err.status === 409) {
        title = "Already Enrolled";
        subtitle = "You are already a member of this class roster.";
      }
      setJoinFeedback({ type: "error", title, subtitle });
    } finally {
      setJoinLoading(false);
    }
  };

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
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">face</span>
            </div>
            <span className="font-bold">AttendAI</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors lg:hidden"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: "dashboard" },
            { id: "my-classes", label: "My Classes", icon: "school" },
            { id: "check-in", label: "Check In", icon: "qr_code_scanner" },
            { id: "history", label: "History", icon: "history" },
            { id: "enrollment", label: "Enrollment", icon: "how_to_reg" },
          ].map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-label-lg transition-all text-left ${
                  active
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-low">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
              {(user?.name || user?.username || "S")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label-md text-on-surface truncate font-semibold">{user?.name || user?.username}</p>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">Student</p>
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
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors lg:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <span className="font-title-md text-on-surface font-semibold capitalize hidden sm:inline-block">
              {activeTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-label-lg text-on-surface">{user?.name || user?.username}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-semibold">
                Student
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors border border-outline-variant/40"
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
          {activeTab === "dashboard" && (
            <DashboardSection
              user={user}
              classes={classes}
              biometrics={biometrics}
              stats={stats}
              setActiveTab={setActiveTab}
              setJoinModalOpen={setJoinModalOpen}
              isLoading={dataLoading}
            />
          )}
          {activeTab === "my-classes" && (
            <MyClassesSection
              classes={classes}
              setActiveTab={setActiveTab}
              setJoinModalOpen={setJoinModalOpen}
              loadHistoryForClass={loadHistoryForClass}
            />
          )}
          {activeTab === "check-in" && (
            <CheckInSection
              classes={classes}
              user={user}
              loadStudentData={loadStudentData}
              setJoinModalOpen={setJoinModalOpen}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "history" && (
            <HistorySection
              classes={classes}
              historyRecords={historyRecords}
              stats={stats}
              historyClassFilter={historyClassFilter}
              loadHistoryForClass={loadHistoryForClass}
            />
          )}
          {activeTab === "enrollment" && (
            <EnrollmentSection
              biometrics={biometrics}
              setBiometrics={setBiometrics}
              user={user}
              loadStudentData={loadStudentData}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>

      {/* Join Class Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col gap-6 relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">key</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface font-semibold">Join a Class</h3>
                  <p className="font-body-sm text-on-surface-variant">Enter 6-character code from your teacher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setJoinModalOpen(false);
                  setJoinFeedback(null);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {joinFeedback && (
              <div
                className={`p-3.5 rounded-xl flex items-start gap-2.5 ${
                  joinFeedback.type === "success"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-error-container text-on-error-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  {joinFeedback.type === "success" ? "check_circle" : "error"}
                </span>
                <div>
                  <p className="font-label-lg font-semibold">{joinFeedback.title}</p>
                  <p className="font-body-sm">{joinFeedback.subtitle}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinClass} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-on-surface" htmlFor="class-code-input">
                    Class code
                  </label>
                  <span className="font-label-sm text-on-surface-variant">{joinCode.length} / 12</span>
                </div>
                <input
                  id="class-code-input"
                  type="text"
                  maxLength={12}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. K7M2QX"
                  autoFocus
                  className="w-full h-14 px-4 rounded-xl bg-surface-container-low text-on-surface font-headline-sm uppercase tracking-[0.2em] focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 border border-outline-variant/40"
                  required
                />
                <span className="font-body-sm text-on-surface-variant text-[12px]">
                  Letters and numbers only.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setJoinModalOpen(false);
                    setJoinFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-lg hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading || !joinCode.trim()}
                  className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg shadow-sm hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {joinLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Join Class</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
