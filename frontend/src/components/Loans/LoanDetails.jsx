import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrendingUp, FiClock } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  const toNum = (v) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const res = await api.get(`/loans/${groupId}/${id}`);
        setLoan(res.data);
      } catch {
        toast.error("Failed to load loan");
        navigate("/loans");
      } finally {
        setLoading(false);
      }
    };
    if (groupId && id) fetchLoan();
  }, [groupId, id, navigate]);

  if (loading)
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    );
  if (!loan) return null;

  const amount = toNum(loan.amount);
  const interestRate = toNum(loan.interest_rate);
  const totalAmount = toNum(loan.total_amount);
  const totalPaid = toNum(loan.total_paid);
  const remaining = totalAmount - totalPaid;
  const progress = totalAmount === 0 ? 0 : (totalPaid / totalAmount) * 100;
  const overdue = new Date(loan.due_date) < new Date();
  const showMakePayment = loan.status === "active" && role === "member";

  const statusConfig = {
    active: { label: "Active", color: "#059669", bg: "#ECFDF5" },
    paid: { label: "Paid", color: "#2563EB", bg: "#EFF6FF" },
    pending: { label: "Pending", color: "#D97706", bg: "#FFFBEB" },
    rejected: { label: "Rejected", color: "#EF4444", bg: "#FEF2F2" },
  };
  const status = statusConfig[loan.status] || {
    label: loan.status,
    color: "#6B7280",
    bg: "#F3F4F6",
  };

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/app/loans")}>
          <FiArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={styles.topLabel}>LOAN #{loan.id}</p>
          <p style={styles.topName}>{loan.fullname}</p>
        </div>
        <span
          style={{
            ...styles.statusBadge,
            color: status.color,
            background: status.bg,
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Hero amount */}
      <div style={styles.heroSection}>
        <p style={styles.heroLabel}>TOTAL DUE</p>
        <p style={styles.heroAmount}>
          K{totalAmount.toLocaleString("en", { minimumFractionDigits: 2 })}
        </p>
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
          <span style={styles.progressLabel}>
            {progress.toFixed(0)}% repaid
          </span>
        </div>
      </div>

      <div style={styles.body}>
        {/* Stat row */}
        <div style={styles.statRow}>
          <div style={styles.statCard}>
            <span style={{ ...styles.statVal, color: "#059669" }}>
              K{totalPaid.toFixed(2)}
            </span>
            <span style={styles.statLabel}>PAID</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statVal, color: "#D97706" }}>
              K{remaining.toFixed(2)}
            </span>
            <span style={styles.statLabel}>REMAINING</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{interestRate.toFixed(1)}%</span>
            <span style={styles.statLabel}>INTEREST</span>
          </div>
        </div>

        {/* Detail rows */}
        <div style={styles.detailCard}>
          {[
            ["Member", loan.fullname],
            ["Phone", loan.phone],
            ["Principal", `K${amount.toFixed(2)}`],
            [
              "Interest Amount",
              `K${((amount * interestRate) / 100).toFixed(2)}`,
            ],
            ["Due Date", new Date(loan.due_date).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} style={styles.detailRow}>
              <span style={styles.detailLabel}>{label}</span>
              <span style={styles.detailValue}>{value}</span>
            </div>
          ))}
          {overdue && loan.status === "active" && (
            <div style={styles.overdueAlert}>
              This loan is past its due date
            </div>
          )}
        </div>

        {/* Repayment history */}
        {loan.repayments && loan.repayments.length > 0 && (
          <div>
            <p style={styles.sectionTitle}>Payment History</p>
            <div style={styles.detailCard}>
              {loan.repayments.map((r, i) => (
                <div
                  key={r.id}
                  style={{ ...styles.detailRow, alignItems: "flex-start" }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={styles.paymentDot} />
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1F2937",
                        }}
                      >
                        K{toNum(r.amount_paid).toFixed(2)}
                      </p>
                      <p style={styles.detailLabel}>{r.payment_method}</p>
                    </div>
                  </div>
                  <span style={styles.detailLabel}>
                    {new Date(r.payment_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      {showMakePayment && (
        <div style={styles.ctaBar}>
          <button
            style={styles.payBtn}
            onClick={() => navigate(`/loans/${loan.id}/repayment`)}
          >
            <FiTrendingUp size={16} /> Make Payment
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    background: "#F8F9FB",
    minHeight: "100vh",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid #E5E7EB",
    borderTopColor: "#059669",
    animation: "spin 0.7s linear infinite",
  },

  topBar: {
    background: "#fff",
    padding: "20px 16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    background: "#F3F4F6",
    border: "none",
    borderRadius: 10,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#374151",
    cursor: "pointer",
  },
  topLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#059669",
    marginBottom: 2,
  },
  topName: { fontSize: 16, fontWeight: 700, color: "#1F2937" },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 20,
    padding: "4px 12px",
  },

  heroSection: {
    background: "#ECFDF5",
    paddingBottom: 28,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#047857",
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: 800,
    color: "#065F46",
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    marginBottom: 16,
  },

  progressWrap: { display: "flex", alignItems: "center", gap: 10 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, background: "#D1FAE5" },
  progressFill: { height: "100%", borderRadius: 3, background: "#059669" },
  progressLabel: { fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" },

  body: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px 16px 100px",
  },

  statRow: { display: "flex", gap: 10 },
  statCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 14,
    padding: "14px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  statVal: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1F2937",
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#9CA3AF",
  },

  detailCard: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 16px",
    borderBottom: "1px solid #F3F4F6",
  },
  detailLabel: { fontSize: 12, color: "#9CA3AF" },
  detailValue: { fontSize: 14, fontWeight: 600, color: "#1F2937" },

  overdueAlert: {
    background: "#FEF2F2",
    color: "#EF4444",
    fontSize: 12,
    fontWeight: 600,
    padding: "10px 16px",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 2,
  },

  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#059669",
    marginTop: 4,
  },

  ctaBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "12px 16px 28px",
    background: "#fff",
    borderTop: "1px solid #F3F4F6",
  },
  payBtn: {
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
  },
};

export default LoanDetails;
