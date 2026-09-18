import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function AdminRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (formData.password !== formData.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("accounts/admin/register/", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password2: formData.password2,
      });

      console.log("Admin register response:", response.data);
      setSuccessMsg("Administrator account created successfully! Redirecting to Admin Login...");
      setTimeout(() => {
        navigate("/admin/login");
      }, 2500);
    } catch (err) {
      console.error("Admin register error:", err);
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.message) {
          setError(data.message);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          const messages = Object.entries(data)
            .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(", ") : message}`)
            .join(" | ");
          setError(messages);
        }
      } else {
        setError("Failed to register Admin account. An Admin account may already exist.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-amber-200/80 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Amber Accent Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-amber-500" />

        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
            🛡️ Initial Admin Setup
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Admin Account</h1>
          <p className="text-xs text-slate-500">Register the primary administrator account for Waniqo Store</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-3 rounded-2xl text-center animate-fadeIn">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-2xl text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. admin"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. admin@waniqo.com"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password (Min 8 Chars) *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm Password *
            </label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-95 mt-2"
          >
            {loading ? "Registering Admin..." : "Register Administrator Account"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
          Already registered as Admin?{" "}
          <Link to="/admin/login" className="font-bold text-amber-700 hover:underline">
            Admin Sign In &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AdminRegister;
