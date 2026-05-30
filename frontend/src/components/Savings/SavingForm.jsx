import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiSave,
  FiUser,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";

const SavingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const storedMemberId = localStorage.getItem("member_id");
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    member_id:
      location.state?.memberId || (role === "member" ? storedMemberId : ""),
    amount: "",
    payment_method: "cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [recentSavings, setRecentSavings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [fetchingData, setFetchingData] = useState(false);

  // For members: if storedMemberId is missing, try to fetch it from the backend
  useEffect(() => {
    if (role === "member" && !storedMemberId && groupId) {
      const fetchMemberId = async () => {
        try {
          const res = await api.get(`/members/member-id/${groupId}`);
          const newMemberId = res.data.member_id;
          localStorage.setItem("member_id", newMemberId);
          setFormData((prev) => ({ ...prev, member_id: newMemberId }));
        } catch (error) {
          console.error("Failed to fetch member ID:", error);
          toast.error(
            "Unable to identify your member profile. Please contact admin.",
          );
        }
      };
      fetchMemberId();
    }
  }, [role, storedMemberId, groupId]);

  // Fetch members for admin
  useEffect(() => {
    if (role === "admin" && groupId) {
      const fetchMembers = async () => {
        try {
          const res = await api.get(`/members/${groupId}`);
          setMembers(res.data);
        } catch (error) {
          toast.error("Failed to load members");
        }
      };
      fetchMembers();
    }
  }, [groupId, role]);

  // Fetch savings data when member_id is available
  const fetchSavingsData = async (memberId) => {
    if (!memberId || !groupId) return;
    setFetchingData(true);
    try {
      const res = await api.get(`/savings/member/${groupId}/${memberId}`);
      setRecentSavings(res.data.savings.slice(0, 5));
      setTotalSavings(res.data.total_savings || 0);
    } catch (error) {
      console.error("Failed to fetch savings:", error);
      setRecentSavings([]);
      setTotalSavings(0);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (formData.member_id) {
      fetchSavingsData(formData.member_id);
    } else {
      setRecentSavings([]);
      setTotalSavings(0);
    }
  }, [formData.member_id, groupId]);

  const handleMemberChange = (e) => {
    const newMemberId = e.target.value;
    setFormData({ ...formData, member_id: newMemberId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_id) {
      toast.error(
        role === "admin"
          ? "Please select a member"
          : "Member ID not found. Please contact admin.",
      );
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await api.post("/savings", { ...formData, groupId });
      toast.success("Saving recorded successfully");
      await fetchSavingsData(formData.member_id);
      setFormData({ ...formData, amount: "", notes: "" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to record saving");
    } finally {
      setLoading(false);
    }
  };

  const isMemberSelected = !!formData.member_id;

  const formatMoney = (value) =>
    `K${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto px-2">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Record Saving</h1>

      {/* Total Savings Card */}
      {isMemberSelected && !fetchingData && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-5 mb-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 rounded-full">
                <FiTrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Total Savings</p>
                <p className="text-3xl font-bold text-emerald-800">
                  {formatMoney(totalSavings)}
                </p>
              </div>
            </div>
            {role === "admin" && formData.member_id && (
              <p className="text-sm text-gray-500">
                {members.find((m) => m.id == formData.member_id)?.fullname}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {role === "admin" && (
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={formData.member_id}
                    onChange={handleMemberChange}
                    required
                  >
                    <option value="">Select Member</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullname} - {m.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Amount (Kwacha) *"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="relative">
                <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                rows="3"
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <FiSave /> {loading ? "Recording..." : "Record Saving"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: Recent Savings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Savings
              </h2>
              {isMemberSelected && !fetchingData && (
                <button
                  onClick={() => fetchSavingsData(formData.member_id)}
                  className="text-emerald-600 hover:text-emerald-700 transition"
                >
                  <FiRefreshCw size={18} />
                </button>
              )}
            </div>
            {!isMemberSelected ? (
              <div className="min-h-[200px]"></div>
            ) : fetchingData ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : recentSavings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No savings yet</p>
            ) : (
              <div className="space-y-3">
                {recentSavings.map((saving) => (
                  <div
                    key={saving.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-emerald-600">
                          +K{saving.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {saving.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700">
                          {new Date(saving.date).toLocaleDateString()}
                        </p>
                        {saving.notes && (
                          <p className="text-xs text-gray-400">
                            {saving.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentSavings.length === 5 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Showing last 5 entries
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingForm;
