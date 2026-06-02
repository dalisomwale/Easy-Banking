import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { FiMail, FiUserPlus, FiArrowLeft } from "react-icons/fi";

const InviteMember = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter an email address");
    setLoading(true);
    try {
      await api.post(`/members/invite/${groupId}`, { email });
      toast.success("Member added successfully");
      navigate("/app/members"); // ✅ fixed: redirect to member list under /app
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-2">
      <button
        onClick={() => navigate("/app/members")} // ✅ fixed: back to members list
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition"
      >
        <FiArrowLeft /> Back to Members
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Add Member by Email
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter user's email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FiUserPlus /> {loading ? "Adding..." : "Add Member"}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            Note: The user must already have an account in Easy Banking. They
            will be added as a member to this group.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteMember;
