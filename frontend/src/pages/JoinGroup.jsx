import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiCode, FiUserPlus, FiArrowLeft } from "react-icons/fi";

const JoinGroup = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Please enter a join code");
    setLoading(true);
    try {
      const res = await api.post("/groups/join", { code: code.toUpperCase() });
      const { group, member_id } = res.data;
      toast.success(`Joined "${group.name}" successfully!`);
      localStorage.setItem("selectedGroupId", group.id);
      localStorage.setItem("selectedGroupName", group.name);
      localStorage.setItem("selectedGroupRole", "member");
      if (member_id) localStorage.setItem("member_id", member_id);
      navigate("/app/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Invalid code or already a member",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX unchanged
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="bg-emerald-700/50 p-4 text-center">
          <h1 className="text-xl font-bold text-white">Join Existing Group</h1>
          <p className="text-emerald-100 text-xs mt-1">
            Enter the group's join code
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="relative">
            <FiCode className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-emerald-500 uppercase"
              placeholder="Enter 6‑character code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={6}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <FiUserPlus /> {loading ? "Joining..." : "Join Group"}
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
        <div className="pb-4 text-center text-white/40 text-xs">
          Kindly contact your group admin for the join code.
        </div>
      </div>
    </div>
  );
};

export default JoinGroup;
