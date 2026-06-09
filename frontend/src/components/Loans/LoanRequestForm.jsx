import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiPercent,
  FiCalendar,
  FiClock,
  FiArrowLeft,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";

const LoanRequestForm = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const memberId = localStorage.getItem("member_id");
  const [formData, setFormData] = useState({
    amount: "",
    interest_rate: "5",
    duration_months: "6",
    issue_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [totalFunds, setTotalFunds] = useState(null);

  useEffect(() => {
    const fetchTotalFunds = async () => {
      try {
        const res = await api.get(`/reports/dashboard/${groupId}`);
        setTotalFunds(res.data.total_funds);
      } catch (error) {
        console.error(error);
      }
    };
    if (groupId) fetchTotalFunds();
  }, [groupId]);

  if (!memberId) {
    toast.error("Member profile not found.");
    setTimeout(() => navigate("/"), 1500);
    return null;
  }

  const amt = parseFloat(formData.amount) || 0;
  const interest = parseFloat(formData.interest_rate) || 0;
  const interestAmt = (amt * interest) / 100;
  const totalDue = amt + interestAmt;
  const exceedsFunds = totalFunds !== null && amt > totalFunds;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (exceedsFunds)
      return toast.error(
        `Insufficient group funds. Available: K${totalFunds.toFixed(2)}`,
      );
    setLoading(true);
    try {
      await api.post("/loans/request", {
        ...formData,
        groupId,
        member_id: memberId,
      });
      toast.success("Loan request submitted.");
      navigate("/loans");
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Hero header with arrow button and heading */}
      <div style={styles.heroHeader}>
        <div style={styles.headerRow}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <FiArrowLeft size={16} color="#A7F3D0" />
          </button>
          <h1 style={styles.pageHeading}>Request a Loan</h1>
        </div>
      </div>

      {/* Floating hero card */}
      <div style={styles.heroCardWrap}>
        <div style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroLabel}>AVAILABLE GROUP FUNDS</p>
            <p style={styles.heroAmount}>
              {totalFunds !== null
                ? `K${totalFunds.toLocaleString("en", { minimumFractionDigits: 2 })}`
                : "Loading…"}
            </p>
            <p style={styles.heroSub}>from savings &amp; repayments</p>
          </div>
        </div>
      </div>

      {/* Form body (unchanged) */}
      <div style={styles.body}>
        <div style={styles.card}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* Amount field */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Loan Amount</label>
              <div
                style={{
                  ...styles.inputWrap,
                  border: exceedsFunds
                    ? "1.5px solid #FCA5A5"
                    : "1.5px solid #E5E7EB",
                }}
              >
                <span
                  style={{
                    paddingLeft: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#9CA3AF",
                  }}
                >
                  K
                </span>
                <input
                  type="number"
                  step="0.01"
                  style={{ ...styles.input, fontSize: 20, fontWeight: 700 }}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              {exceedsFunds && (
                <div style={styles.warningNote}>
                  <FiAlertCircle size={12} /> Exceeds available funds (K
                  {totalFunds.toFixed(2)})
                </div>
              )}
            </div>

            {/* Interest + Duration row */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.fieldLabel}>Interest Rate</label>
                <div style={styles.inputWrap}>
                  <FiPercent
                    style={{ paddingLeft: 10, color: "#9CA3AF" }}
                    size={14}
                  />
                  <input
                    type="number"
                    step="0.5"
                    style={styles.input}
                    placeholder="10"
                    value={formData.interest_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interest_rate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.fieldLabel}>Duration</label>
                <div style={styles.inputWrap}>
                  <FiClock
                    style={{ paddingLeft: 10, color: "#9CA3AF" }}
                    size={14}
                  />
                  <select
                    style={styles.input}
                    value={formData.duration_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_months: e.target.value,
                      })
                    }
                    required
                  >
                    {["3", "6", "9", "12"].map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Issue date */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Issue Date</label>
              <div style={styles.inputWrap}>
                <FiCalendar
                  style={{ paddingLeft: 12, color: "#9CA3AF" }}
                  size={14}
                />
                <input
                  type="date"
                  style={styles.input}
                  value={formData.issue_date}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Summary (only when amount entered) */}
            {formData.amount && (
              <div style={styles.summaryCard}>
                <p style={styles.summaryTitle}>Loan Summary</p>
                <div style={styles.summaryRows}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Principal</span>
                    <span style={styles.summaryVal}>K{amt.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>
                      Interest ({interest}%)
                    </span>
                    <span style={styles.summaryVal}>
                      K{interestAmt.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      ...styles.summaryRow,
                      borderTop: "1px solid #D1FAE5",
                      marginTop: 4,
                      paddingTop: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#065F46",
                      }}
                    >
                      Total Due
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#059669",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      K{totalDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={styles.ctaBar}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate("/loans")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || exceedsFunds}
                style={{
                  ...styles.submitBtn,
                  opacity: loading || exceedsFunds ? 0.5 : 1,
                }}
              >
                {loading ? "Submitting…" : "Request Loan"}
              </button>
            </div>
          </form>
        </div>
      </div>
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

  // Hero header with arrow button and heading
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
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  pageHeading: {
    fontSize: 18,
    fontWeight: 600,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.3px",
  },

  // Floating hero card (unchanged)
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
  heroIconWrap: {
    background: "#D1FAE5",
    borderRadius: "50%",
    width: 50,
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Form body (unchanged)
  body: { padding: "16px" },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#6B7280",
    textTransform: "uppercase",
    paddingLeft: 2,
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: 12,
    border: "1.5px solid #E5E7EB",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px 12px 12px 8px",
    fontSize: 14,
    color: "#1F2937",
    background: "transparent",
    width: "100%",
    fontVariantNumeric: "tabular-nums",
  },
  warningNote: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#D97706",
    fontWeight: 600,
    paddingLeft: 2,
  },
  summaryCard: {
    background: "#ECFDF5",
    border: "1.5px solid #A7F3D0",
    borderRadius: 14,
    padding: "14px 16px",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#065F46",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  summaryRows: { display: "flex", flexDirection: "column", gap: 6 },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 13, color: "#047857" },
  summaryVal: {
    fontSize: 14,
    fontWeight: 600,
    color: "#065F46",
    fontVariantNumeric: "tabular-nums",
  },
  ctaBar: { display: "flex", gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    background: "#fff",
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    padding: "13px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
  },
  submitBtn: {
    flex: 2,
    background: "#059669",
    border: "none",
    borderRadius: 12,
    padding: "13px",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
  },
};

export default LoanRequestForm;
