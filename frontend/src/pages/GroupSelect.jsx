import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiLogIn, FiPlusCircle, FiUsers, FiCode } from "react-icons/fi";

const GroupSelect = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (error) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (groupId, groupName, role) => {
    localStorage.setItem("selectedGroupId", groupId);
    localStorage.setItem("selectedGroupName", groupName);
    localStorage.setItem("selectedGroupRole", role);

    if (role === "member") {
      try {
        const res = await api.get(`/members/member-id/${groupId}`);
        localStorage.setItem("member_id", res.data.member_id);
      } catch (err) {
        console.error("Failed to fetch member_id", err);
        localStorage.removeItem("member_id");
      }
    } else {
      localStorage.removeItem("member_id");
    }
    navigate("/app/dashboard");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-emerald-950 py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Select Your Group</h1>
          <p className="text-emerald-200/70 mt-2">Choose a group to continue</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-row gap-3 justify-center mb-6">
          <button
            onClick={() => navigate("/create-group")}
            className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FiPlusCircle /> Create Group
          </button>
          <button
            onClick={() => navigate("/join-group")}
            className="border border-white/[0.12] hover:bg-white/[0.05] text-white/80 px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FiUsers /> Join Group
          </button>
        </div>

        {/* List of groups */}
        {groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-5 border border-white/[0.12] hover:bg-white/[0.12] transition"
              >
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {group.name}
                    </h2>
                    <p className="text-emerald-200/70 text-sm capitalize mt-1">
                      Role: <span className="font-medium">{group.role}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-emerald-200/70 text-sm">
                      <FiCode className="text-amber-300" /> Group Code:{" "}
                      <span className="font-mono font-medium">
                        {group.code}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSelectGroup(group.id, group.name, group.role)
                    }
                    className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-5 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <FiLogIn /> Enter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fallback when no groups exist */}
        {groups.length === 0 && (
          <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-8 text-center border border-white/[0.12] mt-4">
            <p className="text-white mb-2">
              You are not a member of any group yet.
            </p>
            <p className="text-emerald-200/70 text-sm">
              Create a new group or join using a group code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelect;
