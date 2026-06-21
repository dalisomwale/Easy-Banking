import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiPieChart,
  FiUsers,
  FiPlus,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiPercent,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ─── Header ─────────────────────────────────────────────────────────────
const GroupHeader = () => (
  <div
    style={{
      background: "#064E3B",
      borderRadius: "0 0 2rem 2rem",
      padding: "1.5rem 1.5rem 3.75rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        background: "rgba(255,255,255,0.05)",
        borderRadius: "50%",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: -60,
        left: "30%",
        width: 240,
        height: 240,
        background: "rgba(255,255,255,0.04)",
        borderRadius: "50%",
      }}
    />
    <div style={{ position: "relative", zIndex: 2 }}>
      <p
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#FFFFFF",
          letterSpacing: "-0.3px",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Share-Out Management
      </p>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#A7F3D0",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        Admin Dashboard
      </p>
    </div>
  </div>
);

const HeroCard = ({ label, amount, sub, icon: Icon, color = "#065F46" }) => (
  <div
    style={{
      padding: "0 1rem",
      marginTop: "-1.75rem",
      position: "relative",
      zIndex: 2,
    }}
  >
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #E5E7EB",
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            color: "#6B7280",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: color,
            margin: "4px 0 2px",
            lineHeight: 1,
          }}
        >
          {amount}
        </p>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{sub}</p>
      </div>
      <div
        style={{
          background: "#D1FAE5",
          borderRadius: "50%",
          width: 50,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon color="#065F46" size={22} />
      </div>
    </div>
  </div>
);

const ShareOuts = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentCycle: null,
    totalSavings: 0,
    totalInterest: 0,
    totalFines: 0,
    totalFund: 0,
    eligibleMembers: 0,
    totalShareOut: 0,
  });
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [shareOuts, setShareOuts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    share_out_date: "",
    notes: "",
  });

  const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));
  const formatMoney = (v) => `K${v.toFixed(2)}`;
  const formatPercent = (v) => `${v.toFixed(2)}%`;

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/share-out/dashboard/${groupId}`);
      setStats(res.data);
    } catch (error) {
      toast.error("Failed to load dashboard stats");
      console.error(error);
    }
  }, [groupId]);

  const loadCycles = useCallback(async () => {
    try {
      const res = await api.get(`/share-out/cycles/${groupId}`);
      setCycles(res.data);
    } catch (error) {
      toast.error("Failed to load cycles");
      console.error(error);
    }
  }, [groupId]);

  const loadCycleDetails = useCallback(
    async (cycleId) => {
      try {
        const res = await api.get(
          `/share-out/cycles/details/${cycleId}/${groupId}`,
        );
        setSelectedCycle(res.data.cycle);
        setShareOuts(res.data.shareOuts);
      } catch (error) {
        toast.error("Failed to load cycle details");
        console.error(error);
      }
    },
    [groupId],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadCycles()]);
    setLoading(false);
  }, [loadStats, loadCycles]);

  useEffect(() => {
    if (groupId) loadAll();
  }, [groupId, loadAll]);

  // ── Cycle Actions ──

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      await api.post("/share-out/cycles", { groupId, ...cycleForm });
      toast.success("Cycle created");
      setShowCreateModal(false);
      setCycleForm({
        name: "",
        description: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        share_out_date: "",
        notes: "",
      });
      await loadCycles();
      await loadStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create cycle");
    }
  };

  const handleActivate = async (cycleId) => {
    try {
      await api.put(`/share-out/cycles/activate/${cycleId}`);
      toast.success("Cycle activated");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to activate cycle");
    }
  };

  const handleClose = async (cycleId) => {
    try {
      await api.put(`/share-out/cycles/close/${cycleId}`);
      toast.success("Cycle closed");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to close cycle");
    }
  };

  const handleCalculate = async (cycleId) => {
    try {
      const res = await api.post(`/share-out/cycles/calculate/${cycleId}`);
      toast.success(res.data.message || "Share-out calculated");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to calculate");
    }
  };

  const handleRecalculate = async (cycleId) => {
    try {
      const res = await api.post(`/share-out/cycles/recalculate/${cycleId}`);
      toast.success(res.data.message || "Share-out recalculated");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to recalculate");
    }
  };

  const handleApprove = async (cycleId) => {
    try {
      await api.put(`/share-out/cycles/approve/${cycleId}`);
      toast.success("Share-out approved");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  const handleMarkPayments = async (cycleId) => {
    try {
      await api.put(`/share-out/cycles/payments/${cycleId}`, {});
      toast.success("Payments marked as paid");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        await loadCycleDetails(cycleId);
      }
    } catch (error) {
      toast.error("Failed to mark payments");
    }
  };

  const handleComplete = async (cycleId) => {
    try {
      await api.put(`/share-out/cycles/complete/${cycleId}`);
      toast.success("Cycle completed");
      await loadCycles();
      await loadStats();
      if (selectedCycle && selectedCycle.id === cycleId) {
        setSelectedCycle(null);
        setShareOuts([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete cycle");
    }
  };

  const handleViewCycle = (cycle) => {
    loadCycleDetails(cycle.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      <GroupHeader />
      <HeroCard
        label="Total Share-Out Fund"
        amount={formatMoney(stats.totalFund)}
        sub={`Profit: ${formatMoney(stats.totalInterest + stats.totalFines)} · Eligible: ${stats.eligibleMembers}`}
        icon={FiPieChart}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Current Cycle</p>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {stats.currentCycle ? stats.currentCycle.name : "None"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {stats.currentCycle
                  ? stats.currentCycle.status
                  : "No active cycle"}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <FiClock className="text-emerald-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Savings</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {formatMoney(stats.totalSavings)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <FiDollarSign className="text-emerald-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Interest Earned
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatMoney(stats.totalInterest)}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <FiTrendingUp className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Fines Collected
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatMoney(stats.totalFines)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <FiAlertTriangle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Cycles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Cycles</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm"
          >
            <FiPlus /> New Cycle
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Start Date</th>
                <th className="px-4 py-3 text-left">End Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Total Fund</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cycles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    No cycles created
                  </td>
                </tr>
              ) : (
                cycles.map((cycle) => (
                  <tr key={cycle.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{cycle.name}</td>
                    <td className="px-4 py-3">
                      {new Date(cycle.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {cycle.end_date
                        ? new Date(cycle.end_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          cycle.status === "draft"
                            ? "bg-gray-100 text-gray-700"
                            : cycle.status === "active"
                              ? "bg-green-100 text-green-700"
                              : cycle.status === "closed"
                                ? "bg-blue-100 text-blue-700"
                                : cycle.status === "calculated"
                                  ? "bg-amber-100 text-amber-700"
                                  : cycle.status === "approved"
                                    ? "bg-purple-100 text-purple-700"
                                    : cycle.status === "paid"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : cycle.status === "completed"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(toNumber(cycle.total_fund || 0))}
                    </td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <button
                        onClick={() => handleViewCycle(cycle)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      {cycle.status === "draft" && (
                        <button
                          onClick={() => handleActivate(cycle.id)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Activate"
                        >
                          <FiCheckCircle size={16} />
                        </button>
                      )}
                      {cycle.status === "active" && (
                        <button
                          onClick={() => handleClose(cycle.id)}
                          className="text-purple-600 hover:text-purple-800 p-1"
                          title="Close Cycle"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                      {cycle.status === "closed" && (
                        <button
                          onClick={() => handleCalculate(cycle.id)}
                          className="text-amber-600 hover:text-amber-800 p-1"
                          title="Calculate Share-Out"
                        >
                          <FiTrendingUp size={16} />
                        </button>
                      )}
                      {cycle.status === "calculated" && (
                        <>
                          <button
                            onClick={() => handleRecalculate(cycle.id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Recalculate"
                          >
                            <FiRefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleApprove(cycle.id)}
                            className="text-purple-600 hover:text-purple-800 p-1"
                            title="Approve"
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        </>
                      )}
                      {cycle.status === "approved" && (
                        <button
                          onClick={() => handleMarkPayments(cycle.id)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          title="Mark Payments"
                        >
                          <FiDollarSign size={16} />
                        </button>
                      )}
                      {cycle.status === "paid" && (
                        <button
                          onClick={() => handleComplete(cycle.id)}
                          className="text-emerald-700 hover:text-emerald-900 p-1"
                          title="Complete Cycle"
                        >
                          <FiCheckCircle size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cycle Details */}
      {selectedCycle && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedCycle.name} – Member Share-Outs
              </h2>
              <p className="text-sm text-gray-500">
                Status:{" "}
                <span className="capitalize">{selectedCycle.status}</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedCycle(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-right">Savings</th>
                  <th className="px-4 py-3 text-center">Ownership</th>
                  <th className="px-4 py-3 text-right">Outstanding Loan</th>
                  <th className="px-4 py-3 text-right">Profit Earned</th>
                  <th className="px-4 py-3 text-right">Gross Share-Out</th>
                  <th className="px-4 py-3 text-right">Net Share-Out</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {shareOuts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-400">
                      No share-outs calculated yet
                    </td>
                  </tr>
                ) : (
                  shareOuts.map((so) => (
                    <tr key={so.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{so.fullname}</td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(toNumber(so.savings_amount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {toNumber(so.ownership_percentage).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatMoney(toNumber(so.outstanding_loan))}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {formatMoney(toNumber(so.profit_earned))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatMoney(toNumber(so.gross_share_out))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatMoney(toNumber(so.net_share_out))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            so.payment_status === "paid"
                              ? "bg-green-100 text-green-700"
                              : so.payment_status === "processing"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {so.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Create New Cycle</h3>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cycle Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={cycleForm.name}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows="2"
                  value={cycleForm.description}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={cycleForm.start_date}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={cycleForm.end_date}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, end_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Share-Out Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={cycleForm.share_out_date}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      share_out_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows="2"
                  value={cycleForm.notes}
                  onChange={(e) =>
                    setCycleForm({ ...cycleForm, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex-1"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareOuts;
