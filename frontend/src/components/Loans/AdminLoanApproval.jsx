import React, { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiCalendar,
  FiEye,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const AdminLoanApproval = () => {
  const groupId = localStorage.getItem("selectedGroupId");
  const [pendingLoans, setPendingLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false); // Toggle state
  const [filters, setFilters] = useState({ memberName: "", month: "" });

  useEffect(() => {
    if (groupId && showPending) {
      fetchPendingLoans();
    }
  }, [groupId, showPending]);

  const fetchPendingLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/loans/pending/${groupId}`);
      setPendingLoans(res.data);
      setFilteredLoans(res.data);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      toast.error(
        error.response?.data?.message || "Failed to load pending loans",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId) => {
    try {
      await api.put(`/loans/approve/${loanId}`);
      toast.success("Loan approved");
      fetchPendingLoans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (loanId) => {
    try {
      await api.put(`/loans/reject/${loanId}`);
      toast.success("Loan rejected");
      fetchPendingLoans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Rejection failed");
    }
  };

  const applyFilters = () => {
    let filtered = [...pendingLoans];
    if (filters.memberName) {
      filtered = filtered.filter((loan) =>
        loan.fullname.toLowerCase().includes(filters.memberName.toLowerCase()),
      );
    }
    if (filters.month) {
      const [year, month] = filters.month.split("-");
      filtered = filtered.filter((loan) => {
        const loanDate = new Date(loan.issue_date);
        return (
          loanDate.getFullYear() === parseInt(year) &&
          loanDate.getMonth() + 1 === parseInt(month)
        );
      });
    }
    setFilteredLoans(filtered);
  };

  useEffect(() => {
    if (showPending) applyFilters();
  }, [filters, pendingLoans, showPending]);

  const resetFilters = () => setFilters({ memberName: "", month: "" });

  return (
    <div className="space-y-4">
      {/* Button to toggle pending loans */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowPending(!showPending)}
          className="btn-secondary flex items-center gap-2"
        >
          <FiEye /> {showPending ? "Hide Pending Loans" : "Show Pending Loans"}
        </button>
      </div>

      {showPending && (
        <div className="card overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Pending Loan Requests</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">
                Member Name
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search member..."
                  value={filters.memberName}
                  onChange={(e) =>
                    setFilters({ ...filters, memberName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">
                Request Month
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="month"
                  className="input-field pl-10"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-4">Loading pending requests...</p>
          ) : filteredLoans.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No pending requests
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Member</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  <th className="px-4 py-2 text-right">Amount (K)</th>
                  <th className="px-4 py-2 text-center">Interest</th>
                  <th className="px-4 py-2 text-center">Duration</th>
                  <th className="px-4 py-2 text-center">Request Date</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{loan.fullname}</td>
                    <td className="px-4 py-2">{loan.phone}</td>
                    <td className="px-4 py-2 text-right">
                      K{loan.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {loan.interest_rate}%
                    </td>
                    <td className="px-4 py-2 text-center">
                      {loan.duration_months} months
                    </td>
                    <td className="px-4 py-2 text-center">
                      {new Date(loan.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => handleApprove(loan.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Approve"
                      >
                        <FiCheckCircle size={20} />
                      </button>
                      <button
                        onClick={() => handleReject(loan.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Reject"
                      >
                        <FiXCircle size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLoanApproval;
