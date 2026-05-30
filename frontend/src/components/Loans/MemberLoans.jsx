import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrendingUp,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const MemberLoans = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const memberId = localStorage.getItem("member_id");
  const [activeLoans, setActiveLoans] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !memberId) return;
    fetchLoanData();
  }, [groupId, memberId]);

  const fetchLoanData = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes, summaryRes] = await Promise.all([
        api.get(`/loans/active-for-member/${groupId}/${memberId}`),
        api.get(`/loans/history/${groupId}/${memberId}`),
        api.get(`/loans/summary/${groupId}/${memberId}`),
      ]);
      setActiveLoans(activeRes.data);
      setLoanHistory(historyRes.data);
      setTotalOutstanding(summaryRes.data.total_outstanding);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load loan data");
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (paid, total) => (paid / total) * 100;

  if (loading)
    return <div className="text-center py-10">Loading loan information...</div>;

  return (
    <div className="space-y-6">
      {/* Header with total outstanding */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Loans</h1>
          <p className="text-gray-600 mt-1">Manage your loans and repayments</p>
        </div>
        <button
          onClick={() => navigate("/loans/request")}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus /> Request Loan
        </button>
      </div>

      {/* Total Outstanding Card */}
      <div className="card bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Outstanding Balance</p>
            <p className="text-3xl font-bold text-orange-700">
              K
              {totalOutstanding.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="p-3 bg-orange-500 rounded-full">
            <FiTrendingUp className="text-white" size={24} />
          </div>
        </div>
      </div>

      {/* Active Loans Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Active Loans</h2>
        {activeLoans.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No active loans</p>
        ) : (
          <div className="space-y-4">
            {activeLoans.map((loan) => {
              const percent = getProgress(loan.paid_amount, loan.total_due);
              const overdue = new Date(loan.due_date) < new Date();
              return (
                <div key={loan.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Loan #{loan.id}</h3>
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(loan.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    {overdue && (
                      <div className="flex items-center text-red-600 text-xs">
                        <FiAlertCircle /> Overdue
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                      <span>Principal:</span>
                      <span>K{loan.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Due:</span>
                      <span>K{loan.total_due?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span className="text-green-600">
                        K{loan.paid_amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span className="text-orange-600">
                        K{loan.remaining?.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percent.toFixed(1)}% repaid
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/loans/${loan.id}/repayment`)}
                      className="flex-1 btn-primary flex items-center justify-center gap-1"
                    >
                      <FiTrendingUp /> Make Payment
                    </button>
                    <button
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="flex-1 btn-outline flex items-center justify-center gap-1"
                    >
                      <FiEye /> Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan History Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Loan History</h2>
        {loanHistory.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No loan history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Loan ID</th>
                  <th className="px-4 py-2 text-right">Amount (K)</th>
                  <th className="px-4 py-2 text-center">Interest</th>
                  <th className="px-4 py-2 text-center">Duration</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Request Date</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loanHistory.map((loan) => (
                  <tr key={loan.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">#{loan.id}</td>
                    <td className="px-4 py-2 text-right">
                      {loan.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {loan.interest_rate}%
                    </td>
                    <td className="px-4 py-2 text-center">
                      {loan.duration_months} months
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          loan.status === "active"
                            ? "bg-green-100 text-green-800"
                            : loan.status === "paid"
                              ? "bg-blue-100 text-blue-800"
                              : loan.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {new Date(loan.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => navigate(`/loans/${loan.id}`)}
                        className="text-primary-600 hover:text-primary-800"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberLoans;
