import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiArrowLeft,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const AllSavings = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [savings, setSavings] = useState([]);
  const [filteredSavings, setFilteredSavings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    memberName: "",
    startDate: "",
    endDate: "",
  });

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/savings/all/${groupId}`);
      setSavings(res.data.savings);
      setFilteredSavings(res.data.savings);
      setTotalSavings(toNumber(res.data.total_savings));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load savings records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchSavings();
  }, [groupId]);

  const applyFilters = () => {
    let filtered = [...savings];
    if (filters.memberName) {
      filtered = filtered.filter((s) =>
        s.fullname.toLowerCase().includes(filters.memberName.toLowerCase()),
      );
    }
    if (filters.startDate) {
      filtered = filtered.filter(
        (s) => new Date(s.date) >= new Date(filters.startDate),
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (s) => new Date(s.date) <= new Date(filters.endDate),
      );
    }
    setFilteredSavings(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, savings]);

  const resetFilters = () => {
    setFilters({ memberName: "", startDate: "", endDate: "" });
  };

  const formatMoney = (value) => `K${value.toFixed(2)}`;

  const handleExport = () => {
    const headers = [
      "Date",
      "Member",
      "Amount",
      "Method",
      "Notes",
      "Recorded By",
    ];
    const rows = filteredSavings.map((s) => [
      new Date(s.date).toLocaleDateString(),
      s.fullname,
      s.amount,
      s.payment_method,
      s.notes || "",
      s.recorded_by_name || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-2">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition"
          >
            <FiArrowLeft /> Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">All Savings</h1>
        </div>
        <button
          onClick={handleExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-emerald-700 text-sm font-medium">
              Total Savings (Group)
            </p>
            <p className="text-2xl font-bold text-emerald-800">
              {formatMoney(totalSavings)}
            </p>
          </div>
          <div className="bg-emerald-200 p-3 rounded-full">
            <FiFilter className="text-emerald-700" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Name
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Search member..."
                value={filters.memberName}
                onChange={(e) =>
                  setFilters({ ...filters, memberName: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <button
              onClick={resetFilters}
              className="border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg w-full transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Savings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-gray-600">Member</th>
                <th className="px-4 py-3 text-right text-gray-600">
                  Amount (K)
                </th>
                <th className="px-4 py-3 text-left text-gray-600">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-gray-600">Notes</th>
                <th className="px-4 py-3 text-left text-gray-600">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSavings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No savings records found
                  </td>
                </tr>
              ) : (
                filteredSavings.map((saving) => (
                  <tr
                    key={saving.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(saving.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {saving.fullname}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatMoney(toNumber(saving.amount))}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {saving.payment_method}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {saving.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {saving.recorded_by_name || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          Showing {filteredSavings.length} of {savings.length} records
        </div>
      </div>
    </div>
  );
};

export default AllSavings;
