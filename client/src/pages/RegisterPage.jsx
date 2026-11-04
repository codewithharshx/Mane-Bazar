import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

/* ── Inline icons ──────────────────────────────────────────────────── */
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
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
const CheckCircleIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/* ── Left branding panel ────────────────────────────────────────────── */
const BrandPanel = () => (
  <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 p-10 text-white relative overflow-hidden">
    {/* Decorative circles */}
    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/8 blur-2xl" />
    <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-black/10 blur-3xl" />

    <div className="relative z-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center text-sm font-black border border-white/30">
          MB
        </div>
        <div>
          <p className="text-lg font-black tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Mane Bazar</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Premium Grocery</p>
        </div>
      </div>

      {/* Headline */}
      <div className="mt-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/60 mb-3">Join thousands of happy shoppers</p>
        <h2 className="text-4xl font-extrabold leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Fresh groceries,<br />delivered to<br />your doorstep
        </h2>
        <p className="mt-5 text-sm leading-7 text-white/75 max-w-xs">
          Create your free account and start enjoying same-day delivery, honest prices, and real-time order tracking.
        </p>
      </div>
    </div>

    {/* Feature pills */}
    <div className="relative z-10 space-y-3">
      {[
        { icon: "🚴", text: "Same-day delivery available" },
        { icon: "💰", text: "Free delivery above ₹499" },
        { icon: "🔒", text: "UPI, Card, COD — all accepted" },
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

const RegisterPage = () => {
  const { register, loading } = useAuth();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    else if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      const response = await register(form);
      setSubmittedEmail(response.email || form.email);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create account");
    }
  };

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
          {!submittedEmail ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-2">
                  New account
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Start shopping today
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Free to join — no subscription or hidden fees
                </p>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field label="Full Name" icon={<UserIcon />} error={errors.name}>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Rahul Sharma"
                    disabled={loading}
                    className={`input-field ${errors.name ? "border-rose-300 focus:border-rose-400" : ""}`}
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email Address" icon={<MailIcon />} error={errors.email}>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={`input-field ${errors.email ? "border-rose-300 focus:border-rose-400" : ""}`}
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
                      placeholder="Min. 6 characters"
                      disabled={loading}
                      className={`input-field pr-11 ${errors.password ? "border-rose-300 focus:border-rose-400" : ""}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </Field>

                {/* Password strength hint */}
                {form.password && (
                  <div className="flex gap-1.5 -mt-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength = form.password.length >= 12 ? 4
                        : form.password.length >= 9 ? 3
                        : form.password.length >= 6 ? 2 : 1;
                      return (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= strength
                              ? strength === 1 ? "bg-rose-400"
                                : strength === 2 ? "bg-amber-400"
                                : strength === 3 ? "bg-emerald-400"
                                : "bg-green-500"
                              : "bg-slate-200"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <span className="animate-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRightIcon />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 leading-relaxed">
                  By registering you agree to our{" "}
                  <span className="font-semibold text-slate-600">Terms of Service</span> and{" "}
                  <span className="font-semibold text-slate-600">Privacy Policy</span>.
                </p>
              </form>

              <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-green-600 hover:text-green-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* ── Success state ──────────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircleIcon />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Check your inbox!
              </h2>
              <p className="mt-3 text-sm text-slate-500 leading-7 max-w-xs mx-auto">
                We sent a verification link to{" "}
                <span className="font-bold text-slate-800">{submittedEmail}</span>.
                Verify your email to activate your account.
              </p>

              <Link
                to={`/verify-email?email=${encodeURIComponent(submittedEmail)}`}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-btn-green hover:-translate-y-0.5 transition-all"
              >
                Verify Email Now
                <ArrowRightIcon />
              </Link>

              <p className="mt-5 text-xs text-slate-400">
                Didn't receive it?{" "}
                <Link to="/login" state={{ verificationRequired: true }} className="text-green-600 font-semibold">
                  Resend from Login
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PageTransition>
  );
};

export default RegisterPage;
