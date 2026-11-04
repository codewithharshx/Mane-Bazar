import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

const ForgotPasswordPage = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // Error toast is shown by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card-surface p-8 space-y-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h1 className="text-2xl font-bold text-slate-900">Check your inbox</h1>
              <p className="text-slate-500 text-sm">
                We've sent a password reset link to <strong>{email}</strong>.
                It expires in 15 minutes.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm font-semibold text-green-600 hover:text-green-700"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                  Account recovery
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your registered email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-button w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500">
                Remembered it?{" "}
                <Link to="/login" className="font-semibold text-green-600 hover:text-green-700">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </PageTransition>
  );
};

export default ForgotPasswordPage;
