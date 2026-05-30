import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiTrendingUp } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Error fetching loan:", error);
        toast.error("Failed to load loan");
        navigate("/loans");
      } finally {
        setLoading(false);
      }
    };
    if (groupId && id) fetchLoan();
  }, [groupId, id, navigate]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!loan) return null;

  const amount = toNumber(loan.amount);
  const interestRate = toNumber(loan.interest_rate);
  const totalAmount = toNumber(loan.total_amount);
  const totalPaid = toNumber(loan.total_paid);
  const remaining = totalAmount - totalPaid;
  const progress = totalAmount === 0 ? 0 : (totalPaid / totalAmount) * 100;

  const showMakePayment = loan.status === "active" && role === "member";

  return (
    <div className="max-w-2xl mx-auto px-2">
      <button
        onClick={() => navigate("/loans")}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition"
      >
        <FiArrowLeft /> Back
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Loan Details
          </h1>
          <div className="space-y-1">
            <p className="text-gray-700">
              <strong>Member:</strong> {loan.fullname}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {loan.phone}
            </p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Principal:</span>
              <span className="font-medium">K{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="font-medium">{interestRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Interest Amount:</span>
              <span className="font-medium">
                K{((amount * interestRate) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2 pt-1">
              <span className="font-semibold text-gray-800">Total Due:</span>
              <span className="font-bold text-emerald-700">
                K{totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium text-emerald-600">
                K{totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-medium text-amber-600">
                K{remaining.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="capitalize font-medium">
                {loan.status === "active"
                  ? "🟢 Active"
                  : loan.status === "paid"
                    ? "✅ Paid"
                    : loan.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">
                {new Date(loan.due_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress.toFixed(1)}% repaid
            </p>
          </div>

          {showMakePayment && (
            <button
              onClick={() => navigate(`/loans/${loan.id}/repayment`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full mt-6 py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <FiTrendingUp /> Make Payment
            </button>
          )}

          {loan.repayments && loan.repayments.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Repayment History
              </h3>
              <div className="space-y-2">
                {loan.repayments.map((repayment) => (
                  <div key={repayment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">
                        K{toNumber(repayment.amount_paid).toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(repayment.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Method: {repayment.payment_method}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;
