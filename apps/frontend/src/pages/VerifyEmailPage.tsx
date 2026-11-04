import { useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../services/authApi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, KeyRound, ArrowRight, RefreshCw } from "lucide-react";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email || searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp });
      toast.success("Email verified! You can now log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Please provide your email address");
      return;
    }
    setResending(true);
    try {
      const { data } = await authApi.resendVerification(email);
      if (data?.devOtp) {
        toast.success(`New OTP for testing: ${data.devOtp}`, { duration: 8000 });
      } else {
        toast.success(data?.message || "Verification code resent!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-glass border border-emerald-100/80 p-8 sm:p-10 text-center relative overflow-hidden"
      >
        <div className="w-16 h-16 bg-emerald-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">Verify Email OTP</h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium mb-6">
          Enter the 6-digit verification code sent to your email
        </p>

        <form onSubmit={handleVerify} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              6-Digit OTP Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-btn-green hover:shadow-btn-green-hover flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>{loading ? "Verifying Code..." : "Verify & Continue"}</span>
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          <span>{resending ? "Resending Code..." : "Didn't receive code? Resend OTP"}</span>
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
