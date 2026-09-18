import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
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
    setLoading(true);

    try {
      const response = await api.post("accounts/admin/login/", {
        email: formData.email.trim(),
        password: formData.password,
      });
      console.log("Admin login response:", response.data);

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      const returnedAdmin = response.data.admin || response.data.user;

      const userData = {
        username: returnedAdmin?.username || "Administrator",
        email: returnedAdmin?.email || formData.email,
        isAdmin: true,
      };

      login(accessToken, refreshToken, userData);
      navigate("/admin");
    } catch (err) {
      console.error("Admin login error:", err);
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else if (data.message) {
          setError(data.message);
        } else if (data.non_field_errors) {
          setError(Array.isArray(data.non_field_errors) ? data.non_field_errors.join(", ") : data.non_field_errors);
        } else {
          const messages = Object.entries(data)
            .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(", ") : message}`)
            .join(" | ");
          setError(messages);
        }
      } else {
        setError("Invalid administrator credentials. Please check your username/email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-amber-200/80 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Top Amber Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-amber-500" />

        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
            🔒 Administrator Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Sign In</h1>
          <p className="text-xs text-slate-500">Access store management and analytics workspace</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-2xl text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Admin Email or Username
            </label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. adminasif@gmail.com or admin"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-95 mt-2"
          >
            {loading ? "Authenticating Admin..." : "Sign In to Admin Workspace"}
          </button>
        </form>

        <div className="space-y-2 text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
          <p>
            Need to setup an Admin account?{" "}
            <Link to="/admin/register" className="font-bold text-amber-700 hover:underline">
              Register Admin &rarr;
            </Link>
          </p>
          <p>
            Regular Customer?{" "}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Customer Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
