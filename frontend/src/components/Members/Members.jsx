import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const groupId = localStorage.getItem("selectedGroupId");

  useEffect(() => {
    if (groupId) fetchMembers();
    else navigate("/group-select");
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/members/${groupId}`);
      setMembers(response.data);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `Delete ${name}? This will also remove their savings history.`,
      )
    ) {
      try {
        await api.delete(`/members/${groupId}/${id}`);
        toast.success("Member deleted successfully");
        fetchMembers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete member");
      }
    }
  };

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const filteredMembers = members.filter(
    (member) =>
      member.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.nrc.includes(searchTerm),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Members</h1>
        <button
          onClick={() => navigate("/members/add")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition w-full sm:w-auto justify-center"
        >
          <FiPlus /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or NRC..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredMembers.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No members found</p>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className="p-5 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {member.fullname}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                      <span>📞 {member.phone}</span>
                      <span>🆔 {member.nrc}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        💰 Savings: K{toNumber(member.total_savings).toFixed(2)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${member.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="View"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/members/edit/${member.id}`)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id, member.fullname)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
