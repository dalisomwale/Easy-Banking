import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiTrendingUp,
  FiAlertCircle,
  FiClock,
  FiChevronRight,
  FiChevronDown,
  FiDollarSign,
  FiUserCheck,
  FiUserX,
  FiFileText,
  FiList,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiCalendar,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ── helper: safely read a localStorage value ──
const readStoredId = (key) => {
  const v = localStorage.getItem(key);
  if (!v || v === "null" || v === "undefined") return null;
  return v;
};

// ── Shared hero header ────────────────────────────────────────────────
const HeroHeader = () => (
  <div style={styles.heroHeader}>
    <div style={styles.circle1} />
    <div style={styles.circle2} />
  </div>
);

// ── Floating hero card ── no color prop (kept as green)
const HeroCard = ({ label, value, sub }) => (
  <div style={styles.heroCardWrap}>
    <div style={styles.heroCard}>
      <div style={{ flex: 1 }}>
        <p style={styles.heroLabel}>{label}</p>
        <p style={{ ...styles.heroAmount }}>{value}</p>
        <p style={styles.heroSub}>{sub}</p>
      </div>
    </div>
  </div>
);

const LoanList = () => {
  const navigate = useNavigate();
  const groupId = readStoredId("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [memberId, setMemberId] = useState(readStoredId("member_id"));
  const [activeLoans, setActiveLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({ member: "", status: "all" });

  // ── Helper: fetch member ID ──
  const fetchMemberId = useCallback(async () => {
    if (!groupId || role !== "member") return null;
    if (memberId) return memberId;
    try {
      const res = await api.get(`/members/member-id/${groupId}`);
      const id = res?.data?.member_id ?? null;
      if (!id) {
        setError("Member profile not found. Please contact your group admin.");
        return null;
      }
      localStorage.setItem("member_id", id);
      setMemberId(id);
      return id;
    } catch (err) {
      console.error("Failed to fetch member_id:", err);
      setError("Member profile not found. Please contact your group admin.");
      return null;
    }
  }, [groupId, role, memberId]);

  // ── Fetch functions ──
  const fetchAdminLoans = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await api.get(`/loans/all/${groupId}`, { params: filters });
      const data = Array.isArray(res.data) ? res.data : [];
      setAllLoans(data);
      setFilteredLoans(data);
    } catch (err) {
      console.error("Failed to load loans:", err);
      setError(
        `Failed to load loans: ${err.response?.data?.message || err.message}`,
      );
      setAllLoans([]);
      setFilteredLoans([]);
    }
  }, [groupId, filters]);

  const fetchAdminStats = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await api.get(`/loans/stats/${groupId}`);
      setStats(res.data || {});
    } catch (err) {
      console.error("Failed to load stats:", err);
      setStats({});
    }
  }, [groupId]);

  const fetchMemberLoans = useCallback(
    async (id) => {
      if (!groupId || !id) {
        setActiveLoans([]);
        return;
      }
      try {
        const res = await api.get(`/loans/history/${groupId}/${id}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setActiveLoans(data.filter((l) => l.status === "active"));
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        console.error("Failed to load your loans:", err);
        setError(`Failed to load your loans: ${msg}`);
        setActiveLoans([]);
        toast.error(msg);
      }
    },
    [groupId],
  );

  const fetchRecentActivities = useCallback(async () => {
    if (!groupId) return;
    setLoadingActivities(true);
    try {
      const res = await api.get(`/loans/activities/${groupId}`);
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [groupId]);

  // ── Main load effect ──
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!isMounted) return;
      setLoading(true);
      setLoadingStats(true);
      setError(null);
      try {
        if (!groupId) {
          setError("No group selected.");
          return;
        }
        if (role === "admin") {
          await Promise.all([
            fetchAdminStats(),
            fetchAdminLoans(),
            fetchRecentActivities(),
          ]);
        } else if (role === "member") {
          const id = memberId || (await fetchMemberId());
          if (!id) return;
          await Promise.all([fetchMemberLoans(id), fetchRecentActivities()]);
        } else {
          setError("User role not identified.");
        }
      } catch (err) {
        console.error("Unexpected error loading loans:", err);
        setError("Something went wrong loading loans. Please try refreshing.");
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingStats(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [
    groupId,
    role,
    memberId,
    fetchAdminStats,
    fetchAdminLoans,
    fetchRecentActivities,
    fetchMemberId,
    fetchMemberLoans,
  ]);

  // ── Auto-refresh: listen for loan updates ──
  useEffect(() => {
    const handleLoanUpdate = () => {
      if (role === "admin") {
        fetchAdminStats();
        fetchAdminLoans();
        fetchRecentActivities();
      } else {
        if (memberId) fetchMemberLoans(memberId);
        fetchRecentActivities();
      }
    };
    window.addEventListener("loan-updated", handleLoanUpdate);
    return () => window.removeEventListener("loan-updated", handleLoanUpdate);
  }, [
    role,
    memberId,
    fetchAdminStats,
    fetchAdminLoans,
    fetchMemberLoans,
    fetchRecentActivities,
  ]);

  // ── Apply filters for admin ──
  useEffect(() => {
    if (role === "admin") {
      let filtered = allLoans;
      if (activeTab !== "all") {
        filtered = filtered.filter((l) => l.status === activeTab);
      }
      if (filters.member) {
        filtered = filtered.filter((l) =>
          (l.fullname || "")
            .toLowerCase()
            .includes(filters.member.toLowerCase()),
        );
      }
      setFilteredLoans(filtered);
    }
  }, [allLoans, activeTab, filters, role]);

  const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
  const formatMoney = (v) => `K${toNum(v).toFixed(2)}`;

  const totalOutstanding = activeLoans.reduce(
    (s, l) => s + toNum(l.remaining),
    0,
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case "repayment":
        return <FiDollarSign size={14} />;
      case "loan_approval":
        return <FiUserCheck size={14} />;
      case "loan_rejection":
        return <FiUserX size={14} />;
      case "loan_request":
        return <FiFileText size={14} />;
      default:
        return <FiClock size={14} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "repayment":
        return "#059669";
      case "loan_approval":
        return "#2563EB";
      case "loan_rejection":
        return "#EF4444";
      case "loan_request":
        return "#D97706";
      default:
        return "#6B7280";
    }
  };

  const handleManualRefresh = () => {
    window.dispatchEvent(new Event("loan-updated"));
  };

  const ActivityList = () => (
    <div style={styles.recentSection}>
      <div style={styles.sectionHeader}>
        <FiClock size={14} style={{ color: "#6B7280" }} />
        <span style={styles.sectionTitle}>Recent Activities</span>
      </div>
      <div style={styles.activityCard}>
        {loadingActivities ? (
          <div style={styles.activityLoading}>
            <div style={styles.spinnerSmall} />
          </div>
        ) : activities.length === 0 ? (
          <div style={styles.activityEmpty}>
            <p style={styles.emptyText}>No recent activities</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} style={styles.activityItem}>
              <div
                style={{
                  ...styles.activityIcon,
                  backgroundColor: `${getActivityColor(activity.type)}15`,
                  color: getActivityColor(activity.type),
                }}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div style={styles.activityContent}>
                <p style={styles.activityDescription}>{activity.description}</p>
                <div style={styles.activityMeta}>
                  {activity.member_name && (
                    <span style={styles.activityMember}>
                      {activity.member_name}
                    </span>
                  )}
                  {activity.amount && (
                    <span style={styles.activityAmount}>
                      K{toNum(activity.amount).toFixed(2)}
                    </span>
                  )}
                  <span style={styles.activityDate}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Admin Handlers ──
  const handleApprove = async (loanId) => {
    try {
      await api.put(`/loans/approve/${loanId}`);
      toast.success("Loan approved");
      window.dispatchEvent(new Event("loan-updated"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (loanId) => {
    try {
      await api.put(`/loans/reject/${loanId}`);
      toast.success("Loan rejected");
      window.dispatchEvent(new Event("loan-updated"));
    } catch (error) {
      toast.error(error.response?.data?.message || "Rejection failed");
    }
  };

  if (loading || loadingStats) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              color: "#EF4444",
              fontSize: 14,
              textAlign: "center",
              maxWidth: 280,
            }}
          >
            {error}
          </p>
          <button
            onClick={handleManualRefresh}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <FiRefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── MEMBER VIEW ── (unchanged) */
  if (role === "member") {
    return (
      <div style={styles.page}>
        <HeroHeader />
        <HeroCard
          label="MY LOANS"
          value={`K${totalOutstanding.toLocaleString("en", { minimumFractionDigits: 2 })}`}
          sub="outstanding balance"
        />
        <div style={styles.requestCard}>
          <button
            style={styles.requestLoanBtn}
            onClick={() => navigate("/app/loans/request")}
          >
            <FiPlus size={18} />
            <span>Request a Loan</span>
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Active Loans</span>
          </div>
          {activeLoans.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No active loans</p>
            </div>
          ) : (
            activeLoans.map((loan) => {
              const paid = toNum(loan.paid_amount);
              const totalDue = toNum(loan.total_due);
              const remaining = toNum(loan.remaining);
              const pct = totalDue === 0 ? 0 : (paid / totalDue) * 100;
              const overdue = new Date(loan.due_date) < new Date();
              const isExpanded = expandedLoanId === loan.id;

              return (
                <div key={loan.id} style={styles.activeLoanItem}>
                  <div
                    style={styles.loanSummaryRow}
                    onClick={() =>
                      setExpandedLoanId(isExpanded ? null : loan.id)
                    }
                  >
                    <div style={styles.summaryLeft}>
                      <p style={styles.summaryLoanId}>Loan #{loan.id}</p>
                      <p style={styles.summaryDue}>
                        Due {new Date(loan.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={styles.summaryRight}>
                      {overdue ? (
                        <span style={styles.badgeRedSmall}>
                          <FiAlertCircle size={10} /> Overdue
                        </span>
                      ) : (
                        <span style={styles.badgeGreenSmall}>Active</span>
                      )}
                      {isExpanded ? (
                        <FiChevronDown size={16} style={{ color: "#9CA3AF" }} />
                      ) : (
                        <FiChevronRight
                          size={16}
                          style={{ color: "#9CA3AF" }}
                        />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={styles.expandedDetails}>
                      <div style={styles.amountRow}>
                        <div style={styles.amountBlock}>
                          <span style={styles.amountVal}>
                            K{toNum(loan.amount).toLocaleString()}
                          </span>
                          <span style={styles.amountLabel}>PRINCIPAL</span>
                        </div>
                        <div style={styles.amountDivider} />
                        <div style={styles.amountBlock}>
                          <span
                            style={{ ...styles.amountVal, color: "#059669" }}
                          >
                            K{paid.toFixed(2)}
                          </span>
                          <span style={styles.amountLabel}>PAID</span>
                        </div>
                        <div style={styles.amountDivider} />
                        <div style={styles.amountBlock}>
                          <span
                            style={{ ...styles.amountVal, color: "#D97706" }}
                          >
                            K{remaining.toFixed(2)}
                          </span>
                          <span style={styles.amountLabel}>REMAINING</span>
                        </div>
                      </div>

                      <div style={styles.progressWrap}>
                        <div style={styles.progressTrack}>
                          <div
                            style={{ ...styles.progressFill, width: `${pct}%` }}
                          />
                        </div>
                        <span style={styles.progressLabel}>
                          {pct.toFixed(0)}% repaid
                        </span>
                      </div>

                      <button
                        style={styles.payBtn}
                        onClick={() =>
                          navigate(`/app/loans/${loan.id}/repayment`)
                        }
                      >
                        Make Repayment
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <ActivityList />
      </div>
    );
  }

  /* ── ADMIN VIEW ── (responsive stats cards) */
  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      {/* Stats Cards – 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Total Loan Amount
          </p>
          <p className="text-xl sm:text-3xl font-bold text-gray-700 mt-1 sm:mt-2">
            {formatMoney(stats.totalLoanAmount || 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Paid Loan Amount
          </p>
          <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
            {formatMoney(stats.paidLoanAmount || 0)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Pending
          </p>
          <p className="text-xl sm:text-3xl font-bold text-amber-600 mt-1 sm:mt-2">
            {stats.pendingLoans || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Active Loans
          </p>
          <p className="text-xl sm:text-3xl font-bold text-emerald-600 mt-1 sm:mt-2">
            {stats.activeLoans || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Outstanding: {formatMoney(stats.outstandingAmount || 0)}
          </p>
        </div>
      </div>

      {/* Extra row: Members with Loans and Paid Loan Amount (2 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Members with Loans
          </p>
          <p className="text-xl sm:text-3xl font-bold text-gray-700 mt-1 sm:mt-2">
            {stats.membersWithLoans || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">
            Paid Loan Amount
          </p>
          <p className="text-xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
            {formatMoney(stats.paidLoanAmount || 0)}
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {["all", "pending", "active", "paid", "rejected"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "border-b-2 border-emerald-600 text-emerald-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end mt-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Name
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Search member..."
                  value={filters.member}
                  onChange={(e) =>
                    setFilters({ ...filters, member: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Loan ID</th>
                <th className="px-4 py-3 text-left">Member</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Total Paid</th>
                <th className="px-4 py-3 text-center">Interest</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-left">Issue Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-400">
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{loan.id}</td>
                    <td className="px-4 py-3">{loan.fullname}</td>
                    <td className="px-4 py-3 text-right">
                      {formatMoney(toNum(loan.amount))}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatMoney(toNum(loan.paid_amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {toNum(loan.interest_rate)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          loan.status === "active"
                            ? "bg-green-100 text-green-700"
                            : loan.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : loan.status === "paid"
                                ? "bg-blue-100 text-blue-700"
                                : loan.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600">
                      {formatMoney(toNum(loan.remaining))}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(loan.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <button
                        onClick={() => navigate(`/app/loans/${loan.id}`)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      {loan.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(loan.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Approve"
                          >
                            <FiCheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(loan.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Reject"
                          >
                            <FiXCircle size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Showing {filteredLoans.length} of {allLoans.length} loans
        </div>
      </div>

      <ActivityList />
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background: "#F8F9FB",
    minHeight: "100vh",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#F8F9FB",
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid #E5E7EB",
    borderTopColor: "#059669",
    animation: "spin 0.7s linear infinite",
  },
  spinnerSmall: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    border: "2px solid #E5E7EB",
    borderTopColor: "#059669",
    animation: "spin 0.7s linear infinite",
  },

  heroHeader: {
    background: "#064E3B",
    borderRadius: "0 0 2rem 2rem",
    padding: "1.5rem 1.5rem 3.75rem",
    position: "relative",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    background: "rgba(255,255,255,0.05)",
    borderRadius: "50%",
  },
  circle2: {
    position: "absolute",
    bottom: -60,
    left: "30%",
    width: 240,
    height: 240,
    background: "rgba(255,255,255,0.04)",
    borderRadius: "50%",
  },

  heroCardWrap: {
    padding: "0 1rem",
    marginTop: "-1.75rem",
    position: "relative",
    zIndex: 2,
  },
  heroCard: {
    background: "#fff",
    border: "0.5px solid #E5E7EB",
    borderRadius: 16,
    padding: "1.25rem 1.5rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: 0,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: 700,
    color: "#065F46",
    margin: "4px 0 2px",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  heroSub: {
    fontSize: 11,
    color: "#9CA3AF",
    margin: 0,
  },

  requestCard: {
    background: "#fff",
    borderRadius: 16,
    margin: "0 16px 16px 16px",
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  requestLoanBtn: {
    width: "100%",
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background 0.2s ease",
    ":hover": { background: "#047857" },
  },

  section: {
    padding: "16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#6B7280",
    textTransform: "uppercase",
  },

  activeLoanItem: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  loanSummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    cursor: "pointer",
    backgroundColor: "#fff",
    transition: "background 0.1s ease",
    ":hover": { backgroundColor: "#F9FAFB" },
  },
  summaryLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  summaryLoanId: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1F2937",
    margin: 0,
  },
  summaryDue: {
    fontSize: 12,
    color: "#9CA3AF",
    margin: 0,
  },
  summaryRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  badgeGreenSmall: {
    fontSize: 10,
    fontWeight: 600,
    color: "#059669",
    background: "#ECFDF5",
    borderRadius: 20,
    padding: "2px 8px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  badgeRedSmall: {
    fontSize: 10,
    fontWeight: 600,
    color: "#EF4444",
    background: "#FEF2F2",
    borderRadius: 20,
    padding: "2px 8px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  expandedDetails: {
    padding: "0 16px 16px 16px",
    borderTop: "1px solid #F3F4F6",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  amountRow: { display: "flex", alignItems: "center", gap: 0 },
  amountBlock: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  amountDivider: { width: 1, height: 28, background: "#E5E7EB" },
  amountVal: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1F2937",
    fontVariantNumeric: "tabular-nums",
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#9CA3AF",
  },
  progressWrap: { display: "flex", alignItems: "center", gap: 8 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, background: "#E5E7EB" },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    background: "#059669",
    transition: "width 0.4s ease",
  },
  progressLabel: { fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" },
  payBtn: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    transition: "all 0.2s ease",
    ":hover": { background: "#047857", transform: "scale(1.01)" },
  },

  emptyState: {
    padding: "32px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },

  recentSection: { padding: "8px 16px 32px", marginTop: 4 },
  activityCard: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid #F3F4F6",
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityDescription: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1F2937",
    marginBottom: 4,
  },
  activityMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 11,
    color: "#9CA3AF",
  },
  activityMember: { color: "#6B7280" },
  activityAmount: { fontWeight: 600, color: "#059669" },
  activityDate: { color: "#9CA3AF" },
  activityLoading: {
    padding: "24px",
    display: "flex",
    justifyContent: "center",
  },
  activityEmpty: { padding: "24px", textAlign: "center" },
};

export default LoanList;
