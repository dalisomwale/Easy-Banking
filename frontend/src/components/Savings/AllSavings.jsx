import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiCalendar, FiArrowLeft } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const AllSavings = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [savings, setSavings] = useState([]);
  const [filteredSavings, setFilteredSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/savings/all/${groupId}`);
      setSavings(res.data.savings);
      setFilteredSavings(res.data.savings);
    } catch (error) {
      toast.error("Failed to load savings records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchSavings();
  }, [groupId]);

  // Apply both filters: member name and month
  useEffect(() => {
    let filtered = [...savings];

    // Filter by member name
    if (searchTerm.trim()) {
      filtered = filtered.filter((s) =>
        s.fullname.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by month (format YYYY-MM)
    if (selectedMonth) {
      filtered = filtered.filter((s) => {
        const date = new Date(s.date);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return yearMonth === selectedMonth;
      });
    }

    setFilteredSavings(filtered);
  }, [searchTerm, selectedMonth, savings]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMonth("");
  };

  const formatMoney = (v) => `K${v.toFixed(2)}`;

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-2">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800"
          >
            <FiArrowLeft /> Dashboard
          </button>
        </div>
      </div>

      {/* Filters: Search by member + Month picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Name
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Search member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="month"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Savings table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Member</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {filteredSavings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    No records
                  </td>
                </tr>
              ) : (
                filteredSavings.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{s.fullname}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatMoney(toNumber(s.amount))}
                    </td>
                    <td className="px-4 py-3 capitalize">{s.payment_method}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {s.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.recorded_by_name || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Showing {filteredSavings.length} of {savings.length} records
        </div>
      </div>
    </div>
  );
};

export default AllSavings;
