import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiPlus, FiLogIn, FiUsers } from "react-icons/fi";

const GroupSelect = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const selectGroup = async (groupId, groupName, role) => {
    // Store basic group info
    localStorage.setItem("selectedGroupId", groupId);
    localStorage.setItem("selectedGroupName", groupName);
    localStorage.setItem("selectedGroupRole", role);

    // Fetch member_id for this user in this group
    try {
      const res = await api.get(`/members/member-id/${groupId}`);
      localStorage.setItem("member_id", res.data.member_id);
    } catch (error) {
      console.log("No member record found for this user in the group");
      localStorage.removeItem("member_id");
    }

    navigate("/");
  };

  if (loading)
    return <div className="text-center py-10">Loading groups...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">
          Select Your Group
        </h1>
        {groups.length === 0 && (
          <div className="card text-center">
            <p className="text-gray-500 mb-4">
              You are not a member of any group yet.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/create-group")}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <FiPlus /> Create Group
              </button>
              <button
                onClick={() => navigate("/join-group")}
                className="btn-outline flex-1 flex items-center justify-center gap-2"
              >
                <FiUsers /> Join Group
              </button>
            </div>
          </div>
        )}
        {groups.map((group) => (
          <div
            key={group.id}
            className="card flex justify-between items-center mb-4"
          >
            <div>
              <h2 className="font-semibold">{group.name}</h2>
              <p className="text-sm text-gray-600">
                {group.role === "admin" ? "Admin" : "Member"}
              </p>
              <p className="text-xs text-gray-500">Code: {group.code}</p>
            </div>
            <button
              onClick={() => selectGroup(group.id, group.name, group.role)}
              className="btn-primary flex items-center gap-2"
            >
              <FiLogIn /> Enter
            </button>
          </div>
        ))}
        {groups.length > 0 && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate("/create-group")}
              className="btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <FiPlus /> New Group
            </button>
            <button
              onClick={() => navigate("/join-group")}
              className="btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <FiUsers /> Join Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelect;
