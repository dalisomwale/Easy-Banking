import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiInfo, FiFileText, FiSave, FiArrowLeft } from "react-icons/fi";

const CreateGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Group name is required");
    setLoading(true);
    try {
      const res = await api.post("/groups/create", formData);
      toast.success(`Group "${formData.name}" created!`);
      localStorage.setItem("selectedGroupId", res.data.groupId);
      localStorage.setItem("selectedGroupName", formData.name);
      localStorage.setItem("selectedGroupRole", "admin");
      navigate("/app/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-9 pr-3.5 py-2.5 text-sm bg-white/[0.06] border border-white/[0.12] rounded-lg text-white placeholder-white/30 outline-none focus:bg-white/[0.09] focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition";
  const iconClass =
    "absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/70";

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 bg-white/[0.07] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-full max-w-sm md:max-w-md overflow-hidden border border-white/[0.12] ring-1 ring-white/[0.05] my-6">
        <div className="px-6 sm:px-7 pt-6 pb-5 text-center border-b border-white/[0.08]">
          <div className="flex justify-center mb-2">
            <div className="bg-white/[0.08] p-2 rounded-xl border border-white/[0.12]">
              <svg
                width={30}
                height={30}
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
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Umozi Savings
          </h1>
          <p className="text-emerald-200/70 text-xs mt-1">Create New Group</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 sm:px-7 pt-5 pb-6 space-y-3"
        >
          <div className="relative">
            <FiInfo className={iconClass} size={15} />
            <input
              type="text"
              className={inputClass}
              placeholder="Group Name *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="relative">
            <FiFileText
              className="absolute left-3.5 top-3.5 text-emerald-300/70"
              size={15}
            />
            <textarea
              className={inputClass}
              rows="3"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-emerald-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm"
            >
              <FiSave size={15} /> {loading ? "Creating..." : "Create Group"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/group-select")}
              className="flex-1 border border-white/[0.12] hover:bg-white/[0.05] text-white/80 py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-sm"
            >
              <FiArrowLeft size={15} /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
