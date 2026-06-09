import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiUser,
  FiDollarSign,
  FiPercent,
  FiCalendar,
  FiClock,
  FiArrowLeft,
} from "react-icons/fi";

const LoanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupId = localStorage.getItem("selectedGroupId");
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    member_id: location.state?.memberId || "",
    amount: "",
    interest_rate: "5",
    duration_months: "6",
    issue_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/members/${groupId}`);
        setMembers(res.data);
      } catch {
        toast.error("Failed to load members");
      }
    };
    if (groupId) fetchMembers();
  }, [groupId]);

  const amt = parseFloat(formData.amount) || 0;
  const interest = parseFloat(formData.interest_rate) || 0;
  const interestAmt = (amt * interest) / 100;
  const totalDue = amt + interestAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount || amt <= 0)
      return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await api.post("/loans", { ...formData, groupId });
      toast.success("Loan issued");
      navigate("/loans");
    } catch {
      toast.error("Failed to issue loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/loans")}>
          <FiArrowLeft size={18} />
        </button>
        <div>
          <p style={styles.topLabel}>ADMIN</p>
          <p style={styles.topTitle}>Issue New Loan</p>
        </div>
      </div>

      <div style={styles.body}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {/* Member */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Member</label>
            <div style={styles.inputWrap}>
              <FiUser style={styles.inputIcon} size={15} />
              <select
                style={styles.input}
                value={formData.member_id}
                onChange={(e) =>
                  setFormData({ ...formData, member_id: e.target.value })
                }
                required
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullname} — {m.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Loan Amount</label>
            <div style={styles.inputWrap}>
              <span
                style={{ ...styles.inputIcon, fontSize: 13, fontWeight: 700 }}
              >
                K
              </span>
              <input
                type="number"
                step="0.01"
                style={styles.input}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Interest + Duration row */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>Interest Rate</label>
              <div style={styles.inputWrap}>
                <FiPercent style={styles.inputIcon} size={14} />
                <input
                  type="number"
                  step="0.5"
                  style={styles.input}
                  placeholder="5"
                  value={formData.interest_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, interest_rate: e.target.value })
                  }
                />
              </div>
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>Duration</label>
              <div style={styles.inputWrap}>
                <FiClock style={styles.inputIcon} size={14} />
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
              <FiCalendar style={styles.inputIcon} size={14} />
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

          {/* Summary */}
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
                    style={{ fontSize: 14, fontWeight: 700, color: "#065F46" }}
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

          <div style={styles.ctaBar}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => navigate("/loans")}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? "Issuing…" : "Issue Loan"}
            </button>
          </div>
        </form>
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
  topBar: {
    background: "#fff",
    padding: "20px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #E5E7EB",
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
  },
  topTitle: { fontSize: 18, fontWeight: 700, color: "#1F2937", marginTop: 2 },

  body: { padding: "16px" },

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
    paddingLeft: 12,
  },
  inputIcon: { color: "#9CA3AF", flexShrink: 0 },
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

export default LoanForm;
