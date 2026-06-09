import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiSave,
  FiUser,
  FiRefreshCw,
  FiTrendingUp,
  FiArrowLeft,
  FiPlus,
  FiX,
} from "react-icons/fi";

const SavingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const storedMemberId = localStorage.getItem("member_id");
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    member_id:
      location.state?.memberId || (role === "member" ? storedMemberId : ""),
    amount: "",
    payment_method: "cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [recentSavings, setRecentSavings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [fetchingData, setFetchingData] = useState(false);
  const [showForm, setShowForm] = useState(false); // controls form visibility

  useEffect(() => {
    if (role === "member" && !storedMemberId && groupId) {
      const fetchMemberId = async () => {
        try {
          const res = await api.get(`/members/member-id/${groupId}`);
          const newMemberId = res.data.member_id;
          localStorage.setItem("member_id", newMemberId);
          setFormData((prev) => ({ ...prev, member_id: newMemberId }));
        } catch (error) {
          console.error(error);
          toast.error(
            "Unable to identify your member profile. Please contact admin.",
          );
        }
      };
      fetchMemberId();
    }
  }, [role, storedMemberId, groupId]);

  useEffect(() => {
    if (role === "admin" && groupId) {
      const fetchMembers = async () => {
        try {
          const res = await api.get(`/members/${groupId}`);
          setMembers(res.data);
        } catch (error) {
          toast.error("Failed to load members");
        }
      };
      fetchMembers();
    }
  }, [groupId, role]);

  const fetchSavingsData = async (memberId) => {
    if (!memberId || !groupId) return;
    setFetchingData(true);
    try {
      const res = await api.get(`/savings/member/${groupId}/${memberId}`);
      setRecentSavings(res.data.savings.slice(0, 5));
      setTotalSavings(res.data.total_savings || 0);
    } catch (error) {
      console.error(error);
      setRecentSavings([]);
      setTotalSavings(0);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (formData.member_id) fetchSavingsData(formData.member_id);
    else {
      setRecentSavings([]);
      setTotalSavings(0);
    }
  }, [formData.member_id, groupId]);

  const handleMemberChange = (e) =>
    setFormData({ ...formData, member_id: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_id) {
      toast.error(
        role === "admin"
          ? "Please select a member"
          : "Member ID not found. Contact admin.",
      );
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await api.post("/savings", { ...formData, groupId });
      toast.success("Saving recorded successfully");
      await fetchSavingsData(formData.member_id);
      setFormData({ ...formData, amount: "", notes: "" });
      // optional: keep form open after successful submission
    } catch (error) {
      toast.error("Failed to record saving");
    } finally {
      setLoading(false);
    }
  };

  const isMemberSelected = !!formData.member_id;
  const formatMoney = (value) =>
    `K${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const selectedMemberName =
    role === "admin" && formData.member_id
      ? (members.find((m) => m.id == formData.member_id)?.fullname ?? null)
      : null;

  return (
    <div style={styles.page}>
      {/* Hero header */}
      <div style={styles.heroHeader}>
        <div style={styles.circle1} />
        <div style={styles.circle2} />
      </div>

      {/* Floating hero card */}
      <div style={styles.heroCardWrap}>
        <div style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            {isMemberSelected && !fetchingData ? (
              <>
                <p style={styles.heroLabel}>
                  {selectedMemberName ?? "MY SAVINGS"}
                </p>
                <p style={styles.heroAmount}>{formatMoney(totalSavings)}</p>
                <p style={styles.heroSub}>total savings balance</p>
              </>
            ) : (
              <>
                <p style={styles.heroLabel}>RECORD SAVING</p>
                <p style={styles.heroAmount}>K 0.00</p>
                <p style={styles.heroSub}>select a member to load balance</p>
              </>
            )}
          </div>
          <div style={styles.heroIconWrap}>
            <FiTrendingUp color="#065F46" size={22} />
          </div>
        </div>
      </div>

      {/* Two‑column layout */}
      <div style={styles.columns}>
        {/* Left card: Add Savings button + animated form */}
        <div style={styles.card}>
          {!showForm ? (
            <button
              style={styles.addSavingsBtn}
              onClick={() => setShowForm(true)}
            >
              <FiPlus size={18} />
              <span>Add Savings</span>
            </button>
          ) : (
            <div style={styles.formContainer}>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {role === "admin" && (
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Member</label>
                    <div style={styles.inputWrap}>
                      <FiUser
                        style={{ color: "#9CA3AF", flexShrink: 0 }}
                        size={15}
                      />
                      <select
                        style={styles.input}
                        value={formData.member_id}
                        onChange={handleMemberChange}
                        required
                      >
                        <option value="">Select Member</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullname} — {m.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Amount</label>
                  <div style={styles.inputWrap}>
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

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Payment Method</label>
                  <div style={styles.inputWrap}>
                    <FiCreditCard
                      style={{ color: "#9CA3AF", flexShrink: 0 }}
                      size={14}
                    />
                    <select
                      style={styles.input}
                      value={formData.payment_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Date</label>
                  <div style={styles.inputWrap}>
                    <FiCalendar
                      style={{ color: "#9CA3AF", flexShrink: 0 }}
                      size={14}
                    />
                    <input
                      type="date"
                      style={styles.input}
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Notes</label>
                  <textarea
                    style={{
                      ...styles.input,
                      minHeight: 80,
                      padding: "12px",
                      borderRadius: 12,
                      border: "1.5px solid #E5E7EB",
                    }}
                    placeholder="Optional notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={styles.primaryBtn}
                  >
                    {loading ? "Recording…" : "Add Savings"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={styles.outlineBtn}
                  >
                    <FiX size={15} /> Close
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right card: Recent savings (always visible) */}
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <p style={styles.sectionTitle}>Recent Savings</p>
            {isMemberSelected && !fetchingData && (
              <button
                onClick={() => fetchSavingsData(formData.member_id)}
                style={styles.refreshBtn}
              >
                <FiRefreshCw size={16} />
              </button>
            )}
          </div>

          {!isMemberSelected ? (
            <div style={{ minHeight: 200 }} />
          ) : fetchingData ? (
            <p
              style={{
                textAlign: "center",
                color: "#9CA3AF",
                padding: "24px 0",
              }}
            >
              Loading...
            </p>
          ) : recentSavings.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#9CA3AF",
                padding: "24px 0",
              }}
            >
              No savings yet
            </p>
          ) : (
            <div>
              {recentSavings.map((saving) => (
                <div key={saving.id} style={styles.savingRow}>
                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#059669",
                      }}
                    >
                      +K{Number(saving.amount).toFixed(2)}
                    </p>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {saving.payment_method}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, color: "#1F2937" }}>
                      {new Date(saving.date).toLocaleDateString()}
                    </p>
                    {saving.notes && (
                      <p style={{ fontSize: 11, color: "#D97706" }}>
                        {saving.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {recentSavings.length === 5 && (
                <p
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Showing last 5 entries
                </p>
              )}
            </div>
          )}
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

  // Hero header (unchanged)
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

  columns: {
    display: "flex",
    gap: 16,
    padding: "16px",
    flexWrap: "wrap",
  },
  card: {
    flex: "1 1 300px",
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },

  // Button that reveals the form
  addSavingsBtn: {
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
  },
  // Container for the animated form
  formContainer: {
    animation: "fadeSlideIn 0.3s ease",
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
    paddingLeft: 12,
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

  primaryBtn: {
    flex: 2,
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  outlineBtn: {
    flex: 1,
    background: "#fff",
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    padding: "13px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  refreshBtn: {
    background: "none",
    border: "none",
    color: "#059669",
    cursor: "pointer",
    padding: 4,
  },

  savingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 0",
    borderBottom: "1px solid #F3F4F6",
  },
};

// Inject global keyframes for the animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default SavingForm;
