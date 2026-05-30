import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiUsers, FiInfo, FiSave } from "react-icons/fi";

const CreateGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Group name required");
    setLoading(true);
    try {
      const res = await api.post("/groups/create", {
        name: formData.name,
        description: formData.description,
      });
      toast.success(`Group created! Join code: ${res.data.code}`);
      navigate("/group-select");
    } catch (error) {
      console.error("Create group error:", error);
      const msg = error.response?.data?.message || "Failed to create group";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Create New Group</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Group Name *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <FiInfo className="absolute left-3 top-3 text-gray-400" />
            <textarea
              className="input-field pl-10"
              rows="3"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiSave /> {loading ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
