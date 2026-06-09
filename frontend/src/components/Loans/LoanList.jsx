import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiEye,
  FiTrendingUp,
  FiAlertCircle,
  FiClock,
  FiChevronRight,
  FiDollarSign,
  FiUserCheck,
  FiUserX,
  FiFileText,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const LoanList = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [memberId, setMemberId] = useState(localStorage.getItem("member_id"));
  const [activeLoans, setActiveLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchMemberId = async () => {
      if (!groupId || role !== "member" || memberId) return;
      try {
        const res = await api.get(`/members/member-id/${groupId}`);
        localStorage.setItem("member_id", res.data.member_id);
        setMemberId(res.data.member_id);
      } catch (err) {
        console.error("Failed to fetch member_id:", err);
      }
    };
    fetchMemberId();
  }, [groupId, role, memberId]);

  useEffect(() => {
    if (!groupId) {
      setError("No group selected.");
      setLoading(false);
      return;
    }
    if (role === "admin") fetchAdminLoans();
    else if (role === "member") {
      if (!memberId) {
        setError("Member profile not linked.");
        setLoading(false);
        return;
      }
      fetchMemberLoans();
    } else {
      setError("User role not identified.");
      setLoading(false);
    }
    fetchRecentActivities();
  }, [groupId, role, memberId]);

  const fetchAdminLoans = async () => {
    try {
      const res = await api.get(`/loans/active/${groupId}`);
      setActiveLoans(res.data);
    } catch (err) {
      setError(
        `Failed to load loans: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberLoans = async () => {
    try {
      const res = await api.get(`/loans/history/${groupId}/${memberId}`);
      setPendingLoans(res.data.filter((l) => l.status === "pending"));
      setActiveLoans(res.data.filter((l) => l.status === "active"));
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to load your loans: ${msg}`);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    if (!groupId) return;
    setLoadingActivities(true);
    try {
      const res = await api.get(`/loans/activities/${groupId}`);
      setActivities(res.data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      // Don't show toast for activities, silently fail
    } finally {
      setLoadingActivities(false);
    }
  };

  const toNum = (v) => (isNaN(Number(v)) ? 0 : Number(v));
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

  if (loading)
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    );
  if (error)
    return (
      <div style={styles.centered}>
        <p style={{ color: "#EF4444", fontSize: 14 }}>{error}</p>
      </div>
    );

  /* ── MEMBER VIEW ── */
  if (role === "member") {
    return (
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.topBar}>
          <div>
            <p style={styles.topBarLabel}>MY LOANS</p>
            <p style={styles.topBarAmount}>
              K
              {totalOutstanding.toLocaleString("en", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p style={styles.topBarSub}>outstanding balance</p>
          </div>
          <button
            style={styles.fabSmall}
            onClick={() => navigate("/app/loans/request")}
          >
            <FiPlus size={20} />
          </button>
        </div>

        {/* Pending */}
        {pendingLoans.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <FiClock size={14} style={{ color: "#D97706" }} />
              <span style={{ ...styles.sectionTitle, color: "#D97706" }}>
                Pending
              </span>
            </div>
            {pendingLoans.map((loan) => (
              <div
                key={loan.id}
                style={styles.pendingCard}
                onClick={() => navigate(`/app/loans/${loan.id}`)}
              >
                <div>
                  <p style={styles.cardAmount}>
                    K{toNum(loan.amount).toLocaleString()}
                  </p>
                  <p style={styles.cardMeta}>
                    Requested {new Date(loan.issue_date).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.pendingBadge}>Awaiting approval</div>
              </div>
            ))}
          </div>
        )}

        {/* Active */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Active Loans</span>
          </div>
          {activeLoans.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No active loans</p>
              <button
                style={styles.emptyBtn}
                onClick={() => navigate("/app/loans/request")}
              >
                Request a Loan
              </button>
            </div>
          ) : (
            activeLoans.map((loan) => {
              const paid = toNum(loan.paid_amount);
              const totalDue = toNum(loan.total_due);
              const remaining = toNum(loan.remaining);
              const pct = totalDue === 0 ? 0 : (paid / totalDue) * 100;
              const overdue = new Date(loan.due_date) < new Date();
              return (
                <div key={loan.id} style={styles.loanCard}>
                  <div style={styles.loanCardTop}>
                    <div>
                      <p style={styles.loanId}>Loan #{loan.id}</p>
                      <p style={styles.cardMeta}>
                        Due {new Date(loan.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    {overdue ? (
                      <span style={styles.badgeRed}>
                        <FiAlertCircle size={11} /> Overdue
                      </span>
                    ) : (
                      <span style={styles.badgeGreen}>On Track</span>
                    )}
                  </div>

                  <div style={styles.amountRow}>
                    <div style={styles.amountBlock}>
                      <span style={styles.amountVal}>
                        K{toNum(loan.amount).toLocaleString()}
                      </span>
                      <span style={styles.amountLabel}>PRINCIPAL</span>
                    </div>
                    <div style={styles.amountDivider} />
                    <div style={styles.amountBlock}>
                      <span style={{ ...styles.amountVal, color: "#059669" }}>
                        K{paid.toFixed(2)}
                      </span>
                      <span style={styles.amountLabel}>PAID</span>
                    </div>
                    <div style={styles.amountDivider} />
                    <div style={styles.amountBlock}>
                      <span style={{ ...styles.amountVal, color: "#D97706" }}>
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
                    onClick={() => navigate(`/app/loans/${loan.id}/repayment`)}
                  >
                    <FiTrendingUp size={15} /> Make Payment
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Activities */}
        <ActivityList />
      </div>
    );
  }

  /* ── ADMIN VIEW ── */
  return (
    <div style={styles.page}>
      <div style={styles.adminHeader}>
        <div>
          <p style={styles.topBarLabel}>ACTIVE LOANS</p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1F2937",
              marginTop: 2,
            }}
          >
            {activeLoans.length} borrowers
          </p>
        </div>
        <button
          style={styles.pendingBtn}
          onClick={() => navigate("/app/loans/pending")}
        >
          <FiClock size={14} /> Pending
        </button>
      </div>

      <div style={styles.section}>
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
            return (
              <div
                key={loan.id}
                style={styles.adminLoanRow}
                onClick={() => navigate(`/app/loans/${loan.id}`)}
              >
                <div style={styles.adminRowLeft}>
                  <div style={styles.avatar}>
                    {(loan.fullname || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.adminName}>{loan.fullname}</p>
                    <p style={styles.cardMeta}>{loan.phone}</p>
                  </div>
                </div>
                <div style={styles.adminRowRight}>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#D97706",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      K{remaining.toFixed(2)}
                    </p>
                    <p style={styles.cardMeta}>remaining</p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    {overdue ? (
                      <span style={styles.badgeRed}>
                        <FiAlertCircle size={10} /> Overdue
                      </span>
                    ) : (
                      <span style={styles.badgeGreen}>On Track</span>
                    )}
                    <div
                      style={{
                        width: 60,
                        height: 4,
                        borderRadius: 2,
                        background: "#E5E7EB",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: "#059669",
                        }}
                      />
                    </div>
                  </div>
                  <FiChevronRight size={16} style={{ color: "#9CA3AF" }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recent Activities */}
      <ActivityList />
    </div>
  );
};

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

  topBar: {
    background: "#fff",
    padding: "24px 20px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #E5E7EB",
  },
  topBarLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#059669",
    marginBottom: 6,
  },
  topBarAmount: {
    fontSize: 36,
    fontWeight: 800,
    color: "#059669",
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  topBarSub: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#059669",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },

  adminHeader: {
    background: "#fff",
    padding: "24px 20px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "1px solid #E5E7EB",
  },
  pendingBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#FEF3C7",
    color: "#D97706",
    border: "none",
    borderRadius: 20,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
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

  pendingCard: {
    background: "#ffffff",
    border: "1px solid #fadfdf",
    borderRadius: 14,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  pendingBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#D97706",
    background: "#FEF3C7",
    borderRadius: 20,
    padding: "4px 10px",
  },

  loanCard: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  loanCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  loanId: { fontSize: 14, fontWeight: 700, color: "#1F2937" },

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
    borderRadius: 10,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
  },

  cardAmount: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1F2937",
    fontVariantNumeric: "tabular-nums",
  },
  cardMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  badgeGreen: {
    fontSize: 11,
    fontWeight: 600,
    color: "#059669",
    background: "#ECFDF5",
    borderRadius: 20,
    padding: "3px 8px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },
  badgeRed: {
    fontSize: 11,
    fontWeight: 600,
    color: "#EF4444",
    background: "#FEF2F2",
    borderRadius: 20,
    padding: "3px 8px",
    display: "flex",
    alignItems: "center",
    gap: 3,
  },

  emptyState: {
    padding: "32px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  emptyBtn: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  adminLoanRow: {
    background: "#fff",
    borderRadius: 14,
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    cursor: "pointer",
    gap: 12,
  },
  adminRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  adminRowRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#ECFDF5",
    color: "#059669",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  adminName: { fontSize: 14, fontWeight: 600, color: "#1F2937" },

  // Recent Activities Styles
  recentSection: {
    padding: "8px 16px 32px",
    marginTop: 4,
  },
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
  activityContent: {
    flex: 1,
  },
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
  activityMember: {
    color: "#6B7280",
  },
  activityAmount: {
    fontWeight: 600,
    color: "#059669",
  },
  activityDate: {
    color: "#9CA3AF",
  },
  activityLoading: {
    padding: "24px",
    display: "flex",
    justifyContent: "center",
  },
  activityEmpty: {
    padding: "24px",
    textAlign: "center",
  },
};

export default LoanList;
