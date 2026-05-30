import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiEye,
  FiTrendingUp,
  FiAlertCircle,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const LoanList = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [memberId, setMemberId] = useState(localStorage.getItem("member_id"));
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemberId = async () => {
      if (!groupId) return;
      try {
        const res = await api.get(`/members/member-id/${groupId}`);
        localStorage.setItem("member_id", res.data.member_id);
        setMemberId(res.data.member_id);
      } catch (err) {
        console.error("Failed to fetch member_id:", err);
      }
    };
    if (role === "member" && !memberId) {
      fetchMemberId();
    }
  }, [groupId, role, memberId]);

  useEffect(() => {
    if (!groupId) {
      setError("No group selected. Please go back and select a group.");
      setLoading(false);
      return;
    }
    if (role === "admin") {
      fetchAdminLoans();
    } else if (role === "member") {
      if (!memberId) {
        setError(
          "Member profile not linked. Please re-select your group or contact admin.",
        );
        setLoading(false);
        return;
      }
      fetchMemberLoans();
    } else {
      setError("User role not identified.");
      setLoading(false);
    }
  }, [groupId, role, memberId]);

  const fetchAdminLoans = async () => {
    try {
      const res = await api.get(`/loans/active/${groupId}`);
      setLoans(res.data);
    } catch (err) {
      console.error(err);
      setError(
        `Failed to load loans: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberLoans = async () => {
    try {
      const res = await api.get(
        `/loans/active-for-member/${groupId}/${memberId}`,
      );
      setLoans(res.data);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message;
      setError(`Failed to load your loans: ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getProgress = (paid, total) => {
    const paidNum = toNumber(paid);
    const totalNum = toNumber(total);
    if (totalNum === 0) return 0;
    return (paidNum / totalNum) * 100;
  };

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + toNumber(loan.remaining),
    0,
  );

  if (loading) return <div className="text-center py-10">Loading loans...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Admin header with title and Pending Loans button */}
      {role === "admin" && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Loans</h1>
          <button
            onClick={() => navigate("/loans/pending")}
            className="btn-secondary flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <FiClock /> Pending Loans
          </button>
        </div>
      )}

      {/* Member: Total Outstanding Balance Card (no main heading) */}
      {role === "member" && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-emerald-700 text-sm font-medium">
                Total Outstanding Balance
              </p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">
                K{totalOutstanding.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Sum of all active loan balances
              </p>
            </div>
            <div className="bg-emerald-200 p-3 rounded-full">
              <FiDollarSign className="text-emerald-700" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Active Loans Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Active Loans</h2>
          {role === "member" && (
            <button
              onClick={() => navigate("/loans/request")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <FiPlus /> Request Loan
            </button>
          )}
        </div>
        {loans.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No active loans</p>
        ) : role === "admin" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">Member</th>
                  <th className="px-4 py-3 text-left text-gray-600">Phone</th>
                  <th className="px-4 py-3 text-right text-gray-600">
                    Principal
                  </th>
                  <th className="px-4 py-3 text-right text-gray-600">
                    Total Due
                  </th>
                  <th className="px-4 py-3 text-right text-gray-600">Paid</th>
                  <th className="px-4 py-3 text-right text-gray-600">
                    Remaining
                  </th>
                  <th className="px-4 py-3 text-center text-gray-600">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-center text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const paid = toNumber(loan.paid_amount);
                  const totalDue = toNumber(loan.total_due);
                  const remaining = toNumber(loan.remaining);
                  const percent = getProgress(paid, totalDue);
                  const overdue = new Date(loan.due_date) < new Date();
                  return (
                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {loan.fullname}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{loan.phone}</td>
                      <td className="px-4 py-3 text-right">
                        K{toNumber(loan.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        K{totalDue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        K{paid.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        K{remaining.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {overdue ? (
                          <span className="text-red-600 text-xs flex items-center gap-1">
                            <FiAlertCircle /> Overdue
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs">
                            On Time
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/loans/${loan.id}`)}
                          className="text-emerald-600 hover:text-emerald-800 transition"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Member card view – Details button removed, only Make Payment remains
          <div className="p-5 space-y-4">
            {loans.map((loan) => {
              const paid = toNumber(loan.paid_amount);
              const totalDue = toNumber(loan.total_due);
              const remaining = toNumber(loan.remaining);
              const percent = getProgress(paid, totalDue);
              const overdue = new Date(loan.due_date) < new Date();
              return (
                <div key={loan.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {loan.fullname || `Loan #${loan.id}`}
                      </h3>
                      <p className="text-sm text-gray-500">{loan.phone}</p>
                    </div>
                    {overdue && (
                      <div className="flex items-center text-red-600 text-xs">
                        <FiAlertCircle /> Overdue
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Loan Amount:</span>
                      <span className="font-medium">
                        K{toNumber(loan.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Due:</span>
                      <span className="font-medium">
                        K{totalDue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-medium text-emerald-600">
                        K{paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-amber-600">
                        K{remaining.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {percent.toFixed(1)}% repaid
                      </p>
                    </div>
                  </div>
                  {/* Only Make Payment button – Details removed */}
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/loans/${loan.id}/repayment`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <FiTrendingUp size={16} /> Make Payment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanList;
