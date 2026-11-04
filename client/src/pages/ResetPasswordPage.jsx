import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset link is invalid or expired");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
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
          {!token ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">🔗</div>
              <h1 className="text-2xl font-bold text-slate-900">Link expired</h1>
              <p className="text-slate-500 text-sm">
                This reset link is invalid or has already been used.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block mt-2 text-sm font-semibold text-green-600 hover:text-green-700"
              >
                Request a new link →
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h1 className="text-2xl font-bold text-slate-900">Password changed</h1>
              <p className="text-slate-500 text-sm">
                Your password has been updated. Redirecting you to login…
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                  Account recovery
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Set a new password
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Choose a strong password of at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input-field w-full"
                    placeholder="Repeat your new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-button w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </PageTransition>
  );
};

export default ResetPasswordPage;
