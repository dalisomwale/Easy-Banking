import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiEye, FiSearch } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ── Shared GroupHeader ──
const GroupHeader = ({ title }) => {
  const groupName = localStorage.getItem("selectedGroupName") || "My Group";
  const displayTitle = title || groupName;
  return (
    <div
      style={{
        background: "#064E3B",
        borderRadius: "0 0 2rem 2rem",
        padding: "1.5rem 1.5rem 3.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: "30%",
          width: 240,
          height: 240,
          background: "rgba(255,255,255,0.04)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.3px",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {displayTitle}
        </p>
      </div>
    </div>
  );
};

const MemberList = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const isAdmin = role === "admin";

  // ── mobile detection ──
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (groupId) fetchMembers();
    else {
      toast.error("No group selected");
      navigate("/group-select");
    }
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/members/${groupId}`);
      setMembers(res.data);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) return toast.error("Only admins can delete members");
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

  const filteredMembers = members.filter(
    (m) =>
      m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.nrc.includes(searchTerm),
  );

  if (loading)
    return <div className="text-center py-10">Loading members...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2">
      {/* Mobile header */}
      {isMobile && <GroupHeader title="Manage Members" />}

      {/* Desktop heading – hidden on mobile */}
      {!isMobile && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Members</h1>
          {isAdmin && (
            <button
              onClick={() => navigate("/app/members/invite")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FiPlus /> Add Member (by email)
            </button>
          )}
        </div>
      )}

      {/* Search bar – on mobile, combined with Add Member button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {isMobile && isAdmin ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or NRC..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => navigate("/app/members/invite")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm whitespace-nowrap"
            >
              <FiPlus size={16} /> Add Member
            </button>
          </div>
        ) : (
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or NRC..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Member list (admin view) */}
      {isAdmin ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">NRC</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      No members
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m, idx) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{m.fullname}</td>
                      <td className="px-4 py-3">{m.phone}</td>
                      <td className="px-4 py-3">{m.nrc}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {m.address || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            m.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        <button
                          onClick={() => navigate(`/app/members/${m.id}`)}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="View"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.fullname)}
                          className="text-amber-600 hover:text-amber-800"
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
        </div>
      ) : (
        /* Member view (non-admin) */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No members found</p>
            ) : (
              filteredMembers.map((m, idx) => (
                <div
                  key={m.id}
                  className="px-5 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-gray-800">
                      {m.fullname}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/app/members/${m.id}`)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    title="View"
                  >
                    <FiEye size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;
