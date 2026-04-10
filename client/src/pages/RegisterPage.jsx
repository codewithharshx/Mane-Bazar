import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageTransition from "../components/PageTransition";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register(form);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to register");
    }
  };

  return (
    <PageTransition className="section-shell grid min-h-[70vh] place-items-center py-10">
      <div className="glass-panel w-full max-w-md rounded-[36px] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-600">
          Create account
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Start shopping with Mane Bazar</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="input-field"
            placeholder="Full name"
          />
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="input-field"
            placeholder="Email address"
            type="email"
          />
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="input-field"
            placeholder="Password"
            type="password"
          />
          <button type="submit" disabled={loading} className="gradient-button w-full justify-center">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-700">
            Login
          </Link>
        </p>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;
