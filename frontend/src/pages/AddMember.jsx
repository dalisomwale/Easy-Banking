import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  FiUser,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiCalendar,
  FiSave,
} from "react-icons/fi";

const AddMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    nrc: "",
    address: "",
    join_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullname || !formData.phone || !formData.nrc) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/members", formData);
      toast.success("Member added successfully!");
      navigate("/members");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Member</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <FiUser
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              required
              className="input-field pl-10"
              value={formData.fullname}
              onChange={(e) =>
                setFormData({ ...formData, fullname: e.target.value })
              }
              placeholder="Enter full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="tel"
              required
              className="input-field pl-10"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+260 XXX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NRC/ID Number *
          </label>
          <div className="relative">
            <FiFileText
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              required
              className="input-field pl-10"
              value={formData.nrc}
              onChange={(e) =>
                setFormData({ ...formData, nrc: e.target.value })
              }
              placeholder="Enter NRC or ID number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="relative">
            <FiMapPin
              className="absolute left-3 top-3 text-gray-400"
              size={20}
            />
            <textarea
              className="input-field pl-10"
              rows="3"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter residential address"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Join Date *
          </label>
          <div className="relative">
            <FiCalendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="date"
              required
              className="input-field pl-10"
              value={formData.join_date}
              onChange={(e) =>
                setFormData({ ...formData, join_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            <FiSave size={20} />
            <span>{loading ? "Saving..." : "Save Member"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/members")}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;
