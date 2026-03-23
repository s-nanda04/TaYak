import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup" | "confirm"
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const clearToasts = () => { setError(""); setSuccess(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearToasts();

    const isSignup = mode === "signup";
    const endpoint = isSignup ? "signup" : "login";
    const body = isSignup
      ? { email, password }
      : { username: email, password };

    try {
      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.detail || "Something went wrong";
        if (res.status === 403 && !isSignup) {
          setMode("confirm");
          setError(msg);
        } else {
          setError(msg);
        }
        return;
      }

      if (data.success) {
        if (isSignup && data.needs_email_confirmation) {
          setMode("confirm");
          setSuccess("Check your inbox to confirm your account");
        } else if (isSignup) {
          localStorage.setItem("token", data.token);
          setSuccess("Account created! Redirecting...");
          setTimeout(() => navigate("/feed"), 1200);
        } else {
          localStorage.setItem("token", data.token);
          setSuccess("Login successful! Redirecting...");
          setTimeout(() => navigate("/feed"), 1200);
        }
      } else {
        setError(data.error || (isSignup ? "Signup failed" : "Invalid email or password"));
      }
    } catch {
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";
  const isConfirm = mode === "confirm";

  return (
    <div className="min-h-screen bg-app flex items-center justify-center font-sans">
      <div className="relative w-full h-full min-h-screen overflow-hidden flex items-center justify-center">

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-blob-blue/40 blur-[80px] animate-blob-drift" />
          <div className="absolute bottom-1/4 left-1/3 w-[340px] h-[340px] rounded-full bg-blob-soft/50 blur-[70px] animate-blob-drift-2" />
          <div className="absolute top-1/2 right-1/3 w-[260px] h-[260px] rounded-full bg-blob-light/60 blur-[60px] animate-blob-drift" />
        </div>

        {/* Toast banner */}
        {(error || success) && !isConfirm && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-toast-in">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xs text-caption font-medium shadow-toast ${
                error ? "bg-error-bg text-error-text" : "bg-success-bg text-success-text"
              }`}
            >
              {error ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              <span>{error || success}</span>
            </div>
          </div>
        )}

        {/* Email confirmation card */}
        {isConfirm ? (
          <div className="relative z-10 w-full max-w-[380px] bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card px-5 py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/tamid-logo.png" alt="TAMID Group" className="w-5 h-5 rounded-[3px] object-cover" />
              <span className="text-label-sm text-txt-secondary uppercase">TAMID Group</span>
            </div>

            {/* Mail icon */}
            <div className="mx-auto mb-4 w-12 h-12 rounded-md bg-success-bg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#53B678" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
            </div>

            <h2 className="text-h2 text-txt-primary">Check your email</h2>
            <p className="text-body-sm text-txt-secondary mt-2 max-w-[260px] mx-auto">
              We sent a confirmation link to <span className="font-semibold text-txt-primary">{email}</span>. Click the link to activate your account.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => { setMode("login"); clearToasts(); setPassword(""); }}
                className="w-full h-[34px] bg-btn-primary text-btn-primary-text text-btn-md rounded-xs border border-white/[0.14] transition-all duration-[90ms] ease-design hover:bg-btn-hover active:bg-black"
              >
                Back to sign in
              </button>

              <p className="text-caption text-txt-tertiary">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={async () => {
                    clearToasts();
                    try {
                      const res = await fetch("http://localhost:8000/resend-confirmation", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      const data = await res.json();
                      if (data.success) setSuccess("Confirmation email resent!");
                      else setError(data.error || "Could not resend email");
                    } catch {
                      setError("Could not connect to server");
                    }
                  }}
                  className="font-semibold text-link hover:text-link-hover transition-colors duration-[120ms]"
                >
                  Resend email
                </button>
              </p>
            </div>

            {/* Toast inside confirm card context */}
            {(error || success) && (
              <div className="mt-4 animate-toast-in">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xs text-caption font-medium shadow-toast ${
                    error ? "bg-error-bg text-error-text" : "bg-success-bg text-success-text"
                  }`}
                >
                  {error ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  <span>{error || success}</span>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* Login / Signup card */
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-[380px] bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card px-5 py-6"
          >
            {/* Logo mark */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/tamid-logo.png" alt="TAMID Group" className="w-5 h-5 rounded-[3px] object-cover" />
              <span className="text-label-sm text-txt-secondary uppercase">TAMID Group</span>
            </div>

            {/* Heading block */}
            <div className="text-center mb-4">
              <h2 className="text-h2 text-txt-primary">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-body-sm text-txt-secondary mt-1">
                {isLogin
                  ? "Sign in to access your dashboard"
                  : "Join TaYak to get started"}
              </p>
            </div>

            {/* Input stack */}
            <div className="space-y-2.5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-label-sm text-txt-secondary uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[33px] px-2.5 text-body-sm text-txt-field bg-card border border-subtle rounded-xs transition-all duration-[120ms] ease-design focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus/25"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-label-sm text-txt-secondary uppercase tracking-wider">
                    Password
                  </label>
                  {isLogin && (
                    <button type="button" className="text-body-sm font-semibold text-link hover:text-link-hover transition-colors duration-[120ms]">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    className="w-full h-[33px] px-2.5 pr-9 text-body-sm text-txt-field bg-card border border-subtle rounded-xs transition-all duration-[120ms] ease-design focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary hover:text-txt-secondary transition-colors duration-[120ms]"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full h-[34px] bg-btn-primary text-btn-primary-text text-btn-md rounded-xs border border-white/[0.14] transition-all duration-[90ms] ease-design hover:bg-btn-hover active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3.5">
              <div className="flex-1 h-px bg-[#E1E3E7]" />
              <span className="text-caption text-txt-tertiary">Or continue with</span>
              <div className="flex-1 h-px bg-[#E1E3E7]" />
            </div>

            {/* Social button */}
            <button
              type="button"
              className="w-full h-[33px] flex items-center justify-center gap-2 bg-card border border-btn-sec-border rounded-xs text-btn-md text-btn-sec-text transition-colors duration-[120ms] hover:border-txt-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.97 23.97 0 000 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>

            {/* Toggle mode */}
            <p className="text-center text-body-sm text-txt-secondary mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(isLogin ? "signup" : "login"); clearToasts(); }}
                className="font-semibold text-link hover:text-link-hover transition-colors duration-[120ms]"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
