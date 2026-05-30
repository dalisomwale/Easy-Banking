import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiSave,
  FiArrowLeft,
} from "react-icons/fi";

const RepaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [loan, setLoan] = useState(null);
  const [formData, setFormData] = useState({
    loan_id: id,
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
  });
  const [loading, setLoading] = useState(false);

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const res = await api.get(`/loans/${groupId}/${id}`);
        setLoan(res.data);
      } catch (error) {
        toast.error("Loan not found");
        navigate("/loans");
      }
    };
    if (groupId && id) fetchLoan();
  }, [groupId, id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount_paid);
    const totalAmount = toNumber(loan?.total_amount);
    const totalPaid = toNumber(loan?.total_paid);
    const remaining = totalAmount - totalPaid;

    if (!amount || amount <= 0)
      return toast.error("Please enter a valid amount");
    if (amount > remaining) {
      return toast.error(
        `Amount exceeds remaining balance (K${remaining.toFixed(2)}).`,
      );
    }
    setLoading(true);
    try {
      await api.post("/loans/repayment", { ...formData, groupId });
      toast.success("Repayment recorded");
      navigate(`/loans/${id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to record repayment",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return <div className="text-center py-10">Loading...</div>;

  const totalAmount = toNumber(loan.total_amount);
  const totalPaid = toNumber(loan.total_paid);
  const remaining = totalAmount - totalPaid;

  return (
    <div className="max-w-2xl mx-auto px-2">
      <button
        onClick={() => navigate(`/loans/${id}`)}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition"
      >
        <FiArrowLeft /> Back to Loan
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Make Repayment
          </h1>
          <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
            <h3 className="font-semibold text-emerald-800">Loan Information</h3>
            <div className="mt-2 space-y-1 text-gray-700">
              <p>Member: {loan.fullname}</p>
              <p>Original Principal: K{toNumber(loan.amount).toFixed(2)}</p>
              <p>Interest Rate: {toNumber(loan.interest_rate)}%</p>
              <p>
                Total Due:{" "}
                <span className="font-bold text-emerald-700">
                  K{totalAmount.toFixed(2)}
                </span>
              </p>
              <p>Paid: K{totalPaid.toFixed(2)}</p>
              <p className="text-lg font-semibold text-emerald-800">
                Remaining: K{remaining.toFixed(2)}
              </p>
              <p>Due Date: {new Date(loan.due_date).toLocaleDateString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Amount (Kwacha) *"
                  value={formData.amount_paid}
                  onChange={(e) =>
                    setFormData({ ...formData, amount_paid: e.target.value })
                  }
                  required
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    amount_paid: remaining.toFixed(2),
                  })
                }
                className="text-sm text-emerald-600 hover:text-emerald-800 mt-1"
              >
                Pay Full Balance (K{remaining.toFixed(2)})
              </button>
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
                value={formData.payment_date}
                onChange={(e) =>
                  setFormData({ ...formData, payment_date: e.target.value })
                }
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <FiSave /> {loading ? "Recording..." : "Record Payment"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/loans/${id}`)}
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

export default RepaymentForm;
