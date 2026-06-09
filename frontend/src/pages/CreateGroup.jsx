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

  return (
    // same JSX as before, but navigation buttons use `/group-select`
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="bg-emerald-700/50 p-4 text-center">
          <h1 className="text-xl font-bold text-white">Create New Group</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Start your own banking group
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <FiInfo className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500"
              placeholder="Group Name *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3 text-emerald-300" />
            <textarea
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500"
              rows="3"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <FiSave /> {loading ? "Creating..." : "Create Group"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/group-select")}
              className="flex-1 border border-white/30 text-white hover:bg-white/10 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <FiArrowLeft /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateGroup;
