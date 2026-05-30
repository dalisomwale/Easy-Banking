import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiEye, FiSearch } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const MemberList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const isAdmin = role === "admin";

  useEffect(() => {
    if (groupId) {
      fetchMembers();
    } else {
      toast.error("No group selected");
      navigate("/group-select");
    }
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/members/${groupId}`);
      setMembers(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) {
      toast.error("Only admins can delete members");
      return;
    }
    if (window.confirm(`Delete ${name}? This action cannot be undone.`)) {
      try {
        await api.delete(`/members/${groupId}/${id}`);
        toast.success("Member deleted");
        fetchMembers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
  };

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const filteredMembers = members.filter(
    (m) =>
      m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.nrc.includes(searchTerm),
  );

  if (loading)
    return <div className="text-center py-10">Loading members...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Members</h1>
        {isAdmin && (
          <button
            onClick={() => navigate("/members/add")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FiPlus /> Add New
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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

      {isAdmin ? (
        // Admin: Table view with row numbers
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-gray-600 w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-left text-gray-600">NRC</th>
                  <th className="px-4 py-3 text-left text-gray-600">Address</th>
                  <th className="px-4 py-3 text-center text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-center text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {m.fullname}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{m.nrc}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {m.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${m.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => navigate(`/members/${m.id}`)}
                          className="text-emerald-600 hover:text-emerald-800 transition"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.fullname)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filteredMembers.length} of {members.length} members
          </div>
        </div>
      ) : (
        // Member view: Numbered list – only full name and view button
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No members found</p>
            ) : (
              filteredMembers.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-gray-800 text-base">
                      {m.fullname}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/members/${m.id}`)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="View Details"
                  >
                    <FiEye size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            {filteredMembers.length} member
            {filteredMembers.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
