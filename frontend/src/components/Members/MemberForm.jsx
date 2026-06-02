import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiUser,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiCalendar,
  FiSave,
  FiArrowLeft,
} from "react-icons/fi";

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    nrc: "",
    address: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  useEffect(() => {
    if (id && groupId) {
      const fetchMember = async () => {
        try {
          const res = await api.get(`/members/${groupId}/${id}`);
          const m = res.data;
          setFormData({
            fullname: m.fullname,
            phone: m.phone,
            nrc: m.nrc,
            address: m.address || "",
            join_date: m.join_date,
            status: m.status,
          });
        } catch (error) {
          toast.error("Failed to load member");
          navigate("/app/members"); // ✅ fixed
        }
      };
      fetchMember();
    }
  }, [id, groupId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullname || !formData.phone || !formData.nrc) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!groupId) {
      toast.error("No group selected");
      navigate("/group-select");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/members/${groupId}/${id}`, formData);
      toast.success("Member updated");
      navigate("/app/members"); // ✅ fixed
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2">
      <button
        onClick={() => navigate("/app/members")} // ✅ fixed
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4"
      >
        <FiArrowLeft /> Back to Members
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Edit Member</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Full Name *"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="tel"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="NRC/ID *"
                value={formData.nrc}
                onChange={(e) =>
                  setFormData({ ...formData, nrc: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-emerald-500" />
              <textarea
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                rows="3"
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.join_date}
                onChange={(e) =>
                  setFormData({ ...formData, join_date: e.target.value })
                }
                required
              />
            </div>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <FiSave /> {loading ? "Updating..." : "Update Member"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/members")}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberForm;
