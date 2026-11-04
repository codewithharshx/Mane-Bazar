import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-card border border-slate-100 p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="font-display text-2xl font-bold text-slate-800 mb-2">Forgot Password?</h1>
        {sent ? (
          <div>
            <p className="text-slate-500 mb-6">Check your email for a reset link. It will expire in 30 minutes.</p>
            <Link to="/login" className="text-green-600 font-medium hover:underline">Back to Login</Link>
          </div>
        ) : (
          <>
            <p className="text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com" />
              <button type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <p className="mt-4 text-sm"><Link to="/login" className="text-green-600 hover:underline">Back to Login</Link></p>
          </>
        )}
      </motion.div>
    </div>
  );
};
export default ForgotPasswordPage;
