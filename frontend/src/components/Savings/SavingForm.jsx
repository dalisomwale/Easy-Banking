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
    } catch (error) {
      toast.error("Failed to record saving");
    } finally {
      setLoading(false);
    }
  };

  const isMemberSelected = !!formData.member_id;
  const formatMoney = (value) =>
    `K${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={styles.page}>
      {/* Header – styled exactly like LoanList member view */}
      <div style={styles.topBar}>
        <div style={{ flex: 1 }}>
          {isMemberSelected && !fetchingData ? (
            <>
              <p style={styles.topBarLabel}>
                {role === "admin" && formData.member_id
                  ? (members.find((m) => m.id == formData.member_id)
                      ?.fullname ?? "TOTAL SAVINGS")
                  : "MY SAVINGS"}
              </p>
              <p style={styles.topBarAmount}>{formatMoney(totalSavings)}</p>
              <p style={styles.topBarSub}>total savings balance</p>
            </>
          ) : (
            <>
              <p style={styles.topBarLabel}>
                {role === "admin" ? "ADMIN" : "MEMBER"}
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1F2937",
                  marginTop: 4,
                }}
              >
                Record Saving
              </p>
            </>
          )}
        </div>
      </div>

      {/* Two‑column layout (unchanged) */}
      <div style={styles.columns}>
        {/* Form card */}
        <div style={styles.card}>
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
                    setFormData({ ...formData, payment_method: e.target.value })
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
                style={{ ...styles.input, minHeight: 80, padding: "12px" }}
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
                <FiSave size={15} /> {loading ? "Recording…" : "Record Saving"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={styles.outlineBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Recent savings card */}
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

  // --- Header (matching LoanList member view) ---
  topBar: {
    background: "#fff",
    padding: "24px 20px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #E5E7EB",
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
    flexShrink: 0,
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
    alignSelf: "flex-start",
  },

  // --- Rest of the layout ---
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

export default SavingForm;
