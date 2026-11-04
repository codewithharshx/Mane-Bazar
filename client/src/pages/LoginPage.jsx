import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

/* ── Inline icons ──────────────────────────────────────────────────── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ── Left branding panel ────────────────────────────────────────────── */
const BrandPanel = () => (
  <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 p-10 text-white relative overflow-hidden">
    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/8 blur-2xl" />
    <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-black/10 blur-3xl" />

    <div className="relative z-10">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center text-sm font-black border border-white/30">
          MB
        </div>
        <div>
          <p className="text-lg font-black tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Mane Bazar</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Premium Grocery</p>
        </div>
      </div>

      <div className="mt-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60 mb-3">
          Your neighbourhood grocery store
        </p>
        <h2 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Welcome back<br />to fresh &<br />fast delivery
        </h2>
        <p className="mt-5 text-sm leading-7 text-white/75 max-w-xs">
          Log in to access your orders, wishlist, exclusive deals, and real-time delivery tracking.
        </p>
      </div>
    </div>

    <div className="relative z-10 space-y-3">
      {[
        { icon: "📦", text: "Track your orders live" },
        { icon: "♥", text: "Access your wishlist" },
        { icon: "🎁", text: "Exclusive offers for members" },
      ].map((f) => (
        <div key={f.text} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <span className="text-xl">{f.icon}</span>
          <span className="text-sm font-semibold text-white/90">{f.text}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Field wrapper ─────────────────────────────────────────────────── */
const Field = ({ label, icon, error, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {icon}{label}
    </label>
    {children}
    {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerification, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [showResend, setShowResend] = useState(Boolean(location.state?.verificationRequired));
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [googleLoading, setGoogleLoading] = useState(false);
  const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const googleAuthUrl = `${apiBaseUrl}/auth/google`;
  const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const redirectTo = location.state?.from?.pathname || "/";

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  /* cooldown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* remembered email */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    else if (!validateEmail(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) { toast.error("Please fix the errors below"); return; }
    setIsValidating(true);
    try {
      await login(form);
      if (rememberMe) localStorage.setItem("rememberedEmail", form.email);
      toast.success("✅ Welcome back! Redirecting...");
      setTimeout(() => navigate(redirectTo), 500);
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      if (msg.toLowerCase().includes("verify your email")) {
        setShowResend(true);
        toast.error("📧 Please verify your email first");
      } else {
        toast.error(msg);
      }
      setErrors({ submit: msg });
    } finally {
      setIsValidating(false);
    }
  };

  const handleResend = async () => {
    if (!form.email.trim()) { toast.error("Please enter your email address"); return; }
    if (!validateEmail(form.email)) { toast.error("Please enter a valid email address"); return; }
    setResendLoading(true);
    try {
      await resendVerification(form.email);
      setResendCount((p) => p + 1);
      setResendCooldown(60);
      toast.success("✅ Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    if (!isGoogleConfigured) {
      toast.error("Google login is not configured. Please use email/password or contact support.");
      return;
    }
    setGoogleLoading(true);
    window.location.assign(googleAuthUrl);
  };

  // Divider component
  const Divider = () => (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-2 bg-white text-slate-500 font-semibold uppercase tracking-wider">
          Or continue with
        </span>
      </div>
    </div>
  );
  
  return (
    <PageTransition className="section-shell flex min-h-[88vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200/80 grid lg:grid-cols-2"
        style={{ minHeight: 580 }}
      >
        {/* ── Left brand panel ───────────────────────────────────────── */}
        <BrandPanel />

        {/* ── Right form panel ───────────────────────────────────────── */}
        <div className="flex flex-col justify-center bg-white px-8 py-10 sm:px-12">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-green-600 mb-2">
              Sign in
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Access your orders, wishlist, and personalized offers
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Email Address" icon={<MailIcon />} error={errors.email}>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => {
                  if (form.email && !validateEmail(form.email))
                    setErrors((p) => ({ ...p, email: "Invalid email format" }));
                }}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? "border-rose-300" : ""}`}
                disabled={authLoading || isValidating}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" icon={<LockIcon />} error={errors.password}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  className={`input-field pr-11 ${errors.password ? "border-rose-300" : ""}`}
                  disabled={authLoading || isValidating}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={!form.password}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </Field>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-green-600"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={authLoading || isValidating || googleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              {authLoading || isValidating ? (
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>Sign In<ArrowRightIcon /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <Divider />

          {/* Social login */}
          <button
            type="button"
            onClick={handleGoogleRedirect}
            disabled={!isGoogleConfigured || authLoading || googleLoading}
            title={!isGoogleConfigured ? "Google login not configured" : ""}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200"
          >
            {googleLoading ? (
              <span className="animate-spin h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700" />
            ) : (
              <>
                <GoogleIcon />
                Google
              </>
            )}
          </button>

          {/* Verification resend */}
          {showResend && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <MailIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900">Email verification required</p>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    We've sent a verification link to your email. Please verify to continue.
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="mt-2 text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2 disabled:opacity-60"
                  >
                    {resendLoading ? "Sending…"
                      : resendCooldown > 0 ? `Resend email (${resendCooldown}s)`
                      : `Resend Verification Email${resendCount > 0 ? ` (${resendCount})` : ""}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          {isGoogleConfigured && (
            <>
              <div className="relative my-6 flex items-center">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Or continue with
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="flex justify-center w-full">
                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  disabled={authLoading || isValidating || googleLoading}
                  className="flex w-full max-w-[300px] items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {googleLoading ? (
                    <span className="animate-spin h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-700" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldIcon />
                <span>Secured with OAuth 2.0</span>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-700 transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </motion.div>
    </PageTransition>
  );
};

export default LoginPage;
