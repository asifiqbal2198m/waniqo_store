import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
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
      const response = await api.post("accounts/login/", {
        email: formData.email.trim(),
        password: formData.password,
      });
      console.log("Login response:", response.data);

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      const returnedUser = response.data.user || response.data.admin;
      const userData = {
        username: returnedUser?.username || formData.email.split("@")[0],
        email: returnedUser?.email || formData.email,
        isAdmin: response.data.is_admin || !!response.data.admin,
      };

      login(accessToken, refreshToken, userData);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
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
        setError("Invalid email/username or password. If you haven't registered this account yet, please click Register below.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md shadow-indigo-600/20">
            W
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to your Waniqo Store account</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-2xl text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. iasif3834@gmail.com or username"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-95 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="space-y-2 text-center text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">
              Create Account
            </Link>
          </p>
          <p>
            Store Manager or Admin?{" "}
            <Link to="/admin/login" className="font-bold text-amber-700 hover:underline">
              Admin Portal Sign In &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;