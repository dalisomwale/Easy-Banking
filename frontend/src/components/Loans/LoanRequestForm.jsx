import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiDollarSign,
  FiPercent,
  FiCalendar,
  FiClock,
  FiSave,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";

const LoanRequestForm = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const memberId = localStorage.getItem("member_id");
  const [formData, setFormData] = useState({
    amount: "",
    interest_rate: "5",
    duration_months: "6",
    issue_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [totalFunds, setTotalFunds] = useState(null);
  const [fetchingFunds, setFetchingFunds] = useState(true);

  useEffect(() => {
    const fetchTotalFunds = async () => {
      try {
        const res = await api.get(`/reports/dashboard/${groupId}`);
        setTotalFunds(res.data.total_funds);
      } catch (error) {
        console.error("Failed to fetch group funds", error);
      } finally {
        setFetchingFunds(false);
      }
    };
    if (groupId) fetchTotalFunds();
  }, [groupId]);

  if (!memberId) {
    toast.error("Member profile not found. Please contact admin.");
    setTimeout(() => navigate("/"), 1500);
    return null;
  }

  const calculateTotal = () => {
    const amt = parseFloat(formData.amount) || 0;
    const interest = parseFloat(formData.interest_rate) || 0;
    return amt + (amt * interest) / 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestedAmount = parseFloat(formData.amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }
    if (totalFunds !== null && requestedAmount > totalFunds) {
      return toast.error(
        `Insufficient group funds. Available: K${totalFunds.toFixed(2)}`,
      );
    }
    setLoading(true);
    try {
      await api.post("/loans/request", {
        ...formData,
        groupId,
        member_id: memberId,
      });
      toast.success("Loan request submitted. Awaiting admin approval.");
      navigate("/loans");
    } catch (error) {
      const msg = error.response?.data?.message || "Request failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2">
      <button
        onClick={() => navigate("/loans")}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition"
      >
        <FiArrowLeft /> Back to Loans
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Request a Loan
          </h1>

          {totalFunds !== null && (
            <div className="bg-emerald-50 p-4 rounded-lg mb-6 border border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-800">
                  Available Group Funds:
                </span>
                <span className="text-xl font-bold text-emerald-700">
                  K{totalFunds.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From savings and repayments
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="number"
                step="0.01"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Loan Amount (Kwacha) *"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
              {totalFunds !== null &&
                parseFloat(formData.amount) > totalFunds && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FiAlertCircle /> Exceeds available funds (K
                    {totalFunds.toFixed(2)})
                  </p>
                )}
            </div>

            <div className="relative">
              <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="number"
                step="0.5"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Interest Rate (%)"
                value={formData.interest_rate}
                onChange={(e) =>
                  setFormData({ ...formData, interest_rate: e.target.value })
                }
              />
            </div>

            <div className="relative">
              <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.duration_months}
                onChange={(e) =>
                  setFormData({ ...formData, duration_months: e.target.value })
                }
                required
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
              </select>
            </div>

            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={formData.issue_date}
                onChange={(e) =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
                required
              />
            </div>

            {formData.amount && (
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-800 mb-2">
                  Summary
                </p>
                <div className="flex justify-between text-sm">
                  <span>Principal:</span>
                  <span>K{parseFloat(formData.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Interest ({formData.interest_rate}%):</span>
                  <span>
                    K
                    {(
                      (parseFloat(formData.amount) *
                        parseFloat(formData.interest_rate)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-emerald-200">
                  <span>Total Due:</span>
                  <span>K{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  (totalFunds !== null &&
                    parseFloat(formData.amount) > totalFunds)
                }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FiSave /> {loading ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/loans")}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg transition"
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

export default LoanRequestForm;
