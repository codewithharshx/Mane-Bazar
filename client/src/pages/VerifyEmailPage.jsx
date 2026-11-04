import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";

const VerifyEmailPage = () => {
  const { resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Enter the OTP sent to your inbox.");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Email is required.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setStatus("error");
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail({
        email: email.trim(),
        otp: otp.trim()
      });
      setStatus("success");
      setMessage(data.message || "Email verified successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Verification failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }

    setResendLoading(true);
    try {
      await resendVerification(email.trim());
      setCooldown(60);
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <PageTransition className="section-shell grid min-h-[75vh] place-items-center py-12">
      <div className="glass-panel w-full max-w-xl rounded-[36px] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Account Verification
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Verify your email</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
            placeholder="Email address"
            type="email"
            disabled={status === "success"}
          />
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input-field tracking-[0.35em]"
            placeholder="6-digit OTP"
            inputMode="numeric"
            maxLength={6}
            disabled={status === "success"}
          />

          <button
            type="submit"
            className="gradient-button w-full justify-center"
            disabled={loading || status === "success"}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div
          className={`mt-6 rounded-2xl border p-5 text-sm ${
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : status === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {message}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {status !== "success" && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {resendLoading
                ? "Sending..."
                : cooldown > 0
                  ? `Resend OTP (${cooldown}s)`
                  : "Resend OTP"}
            </button>
          )}

          {status === "success" ? (
            <Link to="/login" className="gradient-button">
              Continue to login
            </Link>
          ) : (
            <Link to="/register" className="gradient-button">
              Back to register
            </Link>
          )}
          <Link to="/" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
            Go home
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmailPage;
