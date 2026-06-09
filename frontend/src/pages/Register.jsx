import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiUserPlus,
} from "react-icons/fi";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nrc: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (!formData.phone || !formData.nrc) {
      return toast.error("Phone and NRC are required");
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nrc: formData.nrc,
        address: formData.address,
        password: formData.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm md:max-w-md overflow-hidden border border-white/20">
        <div className="bg-emerald-700/50 p-4 sm:p-5 text-center">
          <div className="flex justify-center mb-1 sm:mb-2">
            <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg">
              <svg
                width={32}
                height={32}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white sm:w-11 sm:h-11"
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
          <h1 className="text-lg sm:text-xl font-bold text-white">
            Umozi Savings
          </h1>
          <p className="text-emerald-100 text-xs">Create Account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-3 sm:space-y-4"
        >
          <div className="relative">
            <FiUser
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="email"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="tel"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiFileText
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="NRC/ID Number"
              value={formData.nrc}
              onChange={(e) =>
                setFormData({ ...formData, nrc: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiMapPin
              className="absolute left-3 top-3 text-emerald-300"
              size={14}
            />
            <textarea
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              rows="2"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="relative">
            <FiLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="password"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiLock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300"
              size={14}
            />
            <input
              type="password"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-2 transition text-sm"
          >
            <FiUserPlus size={14} /> {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="pb-5 sm:pb-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-emerald-100 hover:text-white underline-offset-2 hover:underline text-sm"
          >
            Already have an account? Login
          </button>
        </div>
        <div className="pb-3 sm:pb-4 text-center text-white/40 text-xs"></div>
      </div>
    </div>
  );
};

export default Register;
