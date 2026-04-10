import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";
import { ShieldCheck, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });

  const redirectTo = location.state?.from?.pathname || "/";

  // Check if Google OAuth is configured
  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
                             !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("your-");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await login(form);
      navigate(redirectTo);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <PageTransition className="section-shell grid min-h-[85vh] place-items-center py-12">
      <div className="card-surface w-full max-w-lg rounded-[48px] bg-white p-10 shadow-2xl shadow-slate-200/60 transition-transform duration-500 hover:scale-[1.01]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-green-600 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-emerald-700">
            Welcome to Mane Bazar
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-slate-900 tracking-tight">Login to your account</h1>
          <p className="mt-4 text-slate-500 font-medium">Access your orders, wishlist, and tailored offers.</p>
        </div>

        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-400">Email Address</label>
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="input-field"
              placeholder="name@example.com"
              type="email"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wide text-slate-400">Password</label>
            <input
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="input-field"
              placeholder="••••••••"
              type="password"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="gradient-button mt-4 flex w-full items-center justify-center gap-3 py-4 text-lg"
          >
            {loading ? "Verifying..." : "Sign In"} <ArrowRight size={20} />
          </button>
        </form>

        {isGoogleConfigured && (
          <>
            <div className="relative my-10 flex items-center">
              <div className="h-[1px] flex-1 bg-slate-100" />
              <span className="mx-4 text-xs font-bold uppercase tracking-widest text-slate-400">or use socials</span>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            <div className="flex justify-center">
              <div className="w-full overflow-hidden rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                <GoogleLogin
                  width="360"
                  shape="pill"
                  onSuccess={(credentialResponse) => {
                    loginWithGoogle(credentialResponse.credential)
                      .then(() => navigate(redirectTo))
                      .catch((error) =>
                        toast.error(error.response?.data?.message || "Google login failed")
                      );
                  }}
                  onError={() => toast.error("Google login failed")}
                />
              </div>
            </div>
          </>
        )}

        <p className="mt-10 text-center text-sm font-medium text-slate-500">
          New to Mane Bazar?{" "}
          <Link to="/register" className="font-bold text-green-700 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </PageTransition>
  );
};

export default LoginPage;
