import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiList,
  FiRefreshCw,
  FiActivity,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ─── Shared components ────────────────────────────────────────────────
const GroupHeader = () => {
  const groupName = localStorage.getItem("selectedGroupName") || "My Group";
  const role = localStorage.getItem("selectedGroupRole");
  return (
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
    </div>
  );
};

const HeroFundCard = ({
  label,
  amount,
  sub,
  icon: Icon,
  color = "#065F46",
}) => (
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

// ─── Main component ──────────────────────────────────────────────────────
const Fines = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const memberId = localStorage.getItem("member_id");

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fines");
  const [fines, setFines] = useState([]);
  const [rules, setRules] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    total_issued: 0,
    total_paid: 0,
    outstanding: 0,
    members_fined: 0,
  });
  const [memberStats, setMemberStats] = useState({
    total_fines: 0,
    paid_fines: 0,
    outstanding: 0,
  });
  const [formData, setFormData] = useState({
    member_id: "",
    rule_id: "",
    amount: "",
    reason: "",
  });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    amount: "",
    status: "active",
  });
  const [editingRule, setEditingRule] = useState(null);
  const [expandedFineId, setExpandedFineId] = useState(null);

  const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));
  const formatMoney = (v) => `K${v.toFixed(2)}`;

  // ── Data fetching ──
  const fetchMembers = useCallback(async () => {
    if (role !== "admin") return;
    try {
      const res = await api.get(`/members/${groupId}`);
      setMembers(res.data);
    } catch (error) {
      toast.error("Failed to load members");
    }
  }, [groupId, role]);

  const fetchRules = useCallback(async () => {
    try {
      const res = await api.get(`/fines/rules/${groupId}`);
      setRules(res.data);
    } catch (error) {
      toast.error("Failed to load fine rules");
    }
  }, [groupId]);

  const fetchFines = useCallback(async () => {
    try {
      let res;
      if (role === "admin") {
        res = await api.get(`/fines/group/${groupId}`);
      } else {
        res = await api.get(`/fines/member/${groupId}/${memberId}`);
      }
      setFines(res.data);
    } catch (error) {
      toast.error("Failed to load fines");
    }
  }, [groupId, role, memberId]);

  const fetchStats = useCallback(async () => {
    if (role === "admin") {
      try {
        const res = await api.get(`/fines/stats/${groupId}`);
        setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    } else if (memberId) {
      try {
        const res = await api.get(`/fines/summary/${groupId}/${memberId}`);
        setMemberStats(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  }, [groupId, role, memberId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchFines(),
      fetchRules(),
      fetchMembers(),
      fetchStats(),
    ]);
    setLoading(false);
  }, [fetchFines, fetchRules, fetchMembers, fetchStats]);

  useEffect(() => {
    if (groupId) loadAll();
  }, [groupId, loadAll]);

  // ── Handlers ──
  const handleIssueFine = async (e) => {
    e.preventDefault();
    if (!formData.member_id || (!formData.rule_id && !formData.amount)) {
      toast.error("Please select a member and provide amount or rule");
      return;
    }
    try {
      await api.post("/fines/issue", {
        groupId,
        member_id: formData.member_id,
        rule_id: formData.rule_id || null,
        amount: formData.rule_id ? undefined : formData.amount,
        reason: formData.reason,
      });
      toast.success("Fine issued successfully");
      setFormData({ member_id: "", rule_id: "", amount: "", reason: "" });
      await loadAll();
      window.dispatchEvent(new Event("fine-paid"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to issue fine");
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      await api.put(`/fines/pay/${fineId}`, {
        paid_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Fine marked as paid");
      await loadAll();
      window.dispatchEvent(new Event("fine-paid"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pay fine");
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fines/rules", { groupId, ...ruleForm });
      toast.success("Rule created");
      setRuleForm({ name: "", description: "", amount: "", status: "active" });
      await fetchRules();
      window.dispatchEvent(new Event("fine-paid"));
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create rule";
      toast.error(msg);
      console.error("Create rule error:", error.response?.data);
    }
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/fines/rules/${editingRule.id}`, { ...ruleForm, groupId });
      toast.success("Rule updated");
      setEditingRule(null);
      setRuleForm({ name: "", description: "", amount: "", status: "active" });
      await fetchRules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update rule");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await api.delete(`/fines/rules/${ruleId}`);
      toast.success("Rule deleted");
      await fetchRules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete rule");
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      amount: rule.amount,
      status: rule.status,
    });
  };

  const handlePayClick = async (fineId) => {
    try {
      await api.put(`/fines/pay/${fineId}`, {
        paid_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Fine paid successfully!");
      await loadAll();
      window.dispatchEvent(new Event("fine-paid"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pay fine");
    }
  };

  const toggleExpand = (fineId) => {
    setExpandedFineId(expandedFineId === fineId ? null : fineId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // MEMBER VIEW – Expandable fines list with pay button
  // ──────────────────────────────────────────────────────────────
  if (role === "member") {
    const totalFines = toNumber(memberStats.total_fines);
    const outstanding = toNumber(memberStats.outstanding);
    const paid = toNumber(memberStats.paid_fines);

    return (
      <div>
        <GroupHeader />
        <HeroFundCard
          label="My Fines"
          amount={formatMoney(totalFines)}
          sub={`Paid: ${formatMoney(paid)} · Outstanding: ${formatMoney(outstanding)}`}
          icon={FiAlertTriangle}
          color="#DC2626"
        />

        <div className="mt-5 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiActivity className="text-red-500" size={20} />
                <h2 className="text-xl font-semibold text-gray-800">
                  Fine History
                </h2>
              </div>
            </div>
            <div className="p-4">
              {fines.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No fines recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {fines.map((fine) => {
                    const isExpanded = expandedFineId === fine.id;
                    const isPaid = fine.status === "paid";

                    return (
                      <div
                        key={fine.id}
                        className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header – always visible */}
                        <div
                          className="flex justify-between items-center p-4 cursor-pointer bg-white hover:bg-gray-50"
                          onClick={() => toggleExpand(fine.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">
                                {fine.rule_name || "Custom Fine"}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  isPaid
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isPaid ? "Paid" : "Unpaid"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {new Date(fine.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">
                              {formatMoney(toNumber(fine.amount))}
                            </p>
                            <span className="text-xs text-gray-400">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                            <div className="space-y-2 text-sm">
                              {fine.reason && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Reason:
                                  </span>{" "}
                                  {fine.reason}
                                </p>
                              )}
                              {fine.rule_name && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Rule:
                                  </span>{" "}
                                  {fine.rule_name}
                                </p>
                              )}
                              <p>
                                <span className="font-medium text-gray-700">
                                  Issued:
                                </span>{" "}
                                {new Date(fine.created_at).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">
                                  Amount:
                                </span>{" "}
                                <span className="text-red-600 font-semibold">
                                  {formatMoney(toNumber(fine.amount))}
                                </span>
                              </p>
                              {isPaid && fine.paid_date && (
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Paid on:
                                  </span>{" "}
                                  {new Date(
                                    fine.paid_date,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              {!isPaid && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePayClick(fine.id);
                                  }}
                                  className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
                                >
                                  Pay Now
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // ADMIN VIEW – responsive stats cards
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      {/* Stats cards – 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">
              Total Fines
            </p>
            <p className="text-xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
              {formatMoney(stats.total_issued)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">Paid</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
              {formatMoney(stats.total_paid)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">
              Outstanding
            </p>
            <p className="text-xl sm:text-3xl font-bold text-amber-600 mt-1 sm:mt-2">
              {formatMoney(stats.outstanding)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-medium">
              Members Fined
            </p>
            <p className="text-xl sm:text-3xl font-bold text-gray-700 mt-1 sm:mt-2">
              {stats.members_fined}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "fines" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("fines")}
        >
          <FiList className="inline mr-1" /> All Fines
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "issue" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("issue")}
        >
          <FiPlus className="inline mr-1" /> Issue Fine
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === "rules" ? "border-b-2 border-emerald-600 text-emerald-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("rules")}
        >
          <FiEdit className="inline mr-1" /> Manage Rules
        </button>
      </div>

      {/* Tab Content – unchanged */}
      {activeTab === "fines" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      No fines recorded
                    </td>
                  </tr>
                ) : (
                  fines.map((fine) => (
                    <tr key={fine.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {fine.member_name}
                      </td>
                      <td className="px-4 py-3">{fine.reason}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        {formatMoney(toNumber(fine.amount))}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(fine.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            fine.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {fine.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {fine.status === "unpaid" && (
                          <button
                            onClick={() => handlePayFine(fine.id)}
                            className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 mx-auto"
                          >
                            <FiCheckCircle /> Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
            Showing {fines.length} fines
          </div>
        </div>
      )}

      {activeTab === "issue" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h3 className="text-lg font-semibold mb-4">Issue Fine</h3>
          <form onSubmit={handleIssueFine} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Member *
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={formData.member_id}
                onChange={(e) =>
                  setFormData({ ...formData, member_id: e.target.value })
                }
                required
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fine Rule (optional)
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1"
                value={formData.rule_id}
                onChange={(e) => {
                  const ruleId = e.target.value;
                  setFormData({ ...formData, rule_id: ruleId, amount: "" });
                  if (ruleId) {
                    const rule = rules.find((r) => r.id == ruleId);
                    if (rule)
                      setFormData((prev) => ({ ...prev, amount: rule.amount }));
                  }
                }}
              >
                <option value="">None (custom amount)</option>
                {rules
                  .filter((r) => r.status === "active")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (K{r.amount})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg pl-10 pr-3 py-2"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required={!formData.rule_id}
                  disabled={!!formData.rule_id}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason *
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Late attendance, missed contribution, etc."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Issue Fine
            </button>
          </form>
        </div>
      )}

      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? "Edit Rule" : "Create New Rule"}
            </h3>
            <form
              onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rule Name *
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (K) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={ruleForm.amount}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows="2"
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={ruleForm.status}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </button>
                {editingRule && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(null);
                      setRuleForm({
                        name: "",
                        description: "",
                        amount: "",
                        status: "active",
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-8 text-gray-400"
                      >
                        No rules defined
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{rule.name}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {rule.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(toNumber(rule.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${rule.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                          >
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;
