import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Please fill all fields");
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", formData);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.member_id) localStorage.setItem("member_id", user.member_id);
      else localStorage.removeItem("member_id");
      toast.success("Welcome back!");
      navigate("/group-select");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow — subtle, not a loud gradient sweep */}
      <div className="absolute -top-32 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 bg-white/[0.07] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-full max-w-sm md:max-w-md overflow-hidden border border-white/[0.12] ring-1 ring-white/[0.05]">
        <div className="px-6 sm:px-8 pt-7 sm:pt-9 pb-6 text-center border-b border-white/[0.08]">
          <div className="flex justify-center mb-3">
            <div className="bg-white/[0.08] p-2.5 rounded-xl border border-white/[0.12]">
              <svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-amber-300"
              >
                <path
                  d="M4 9.5L12 4L20 9.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <rect
                  x="6"
                  y="9.5"
                  width="12"
                  height="12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="9"
                  y1="12"
                  x2="9"
                  y2="21.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <line
                  x1="12"
                  y1="12"
                  x2="12"
                  y2="21.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <line
                  x1="15"
                  y1="12"
                  x2="15"
                  y2="21.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Umozi Savings
          </h1>
          <p className="text-emerald-200/70 text-xs sm:text-sm mt-1">
            A Village Banking System
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 sm:px-8 pt-6 pb-7 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-emerald-100/80 mb-1.5 tracking-wide">
              EMAIL
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/70"
                size={16}
              />
              <input
                type="email"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 outline-none focus:bg-white/[0.09] focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-emerald-100/80 mb-1.5 tracking-wide">
              PASSWORD
            </label>
            <div className="relative">
              <FiLock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/70"
                size={16}
              />
              <input
                type="password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 outline-none focus:bg-white/[0.09] focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-emerald-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm mt-2"
          >
            <FiLogIn size={16} /> {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="pb-7 text-center">
          <button
            onClick={() => navigate("/register")}
            className="text-emerald-200/70 hover:text-white underline-offset-2 hover:underline text-sm transition"
          >
            Don't have an account? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
