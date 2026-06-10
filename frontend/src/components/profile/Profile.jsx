import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiAward, FiLogOut, FiX, FiRefreshCw } from "react-icons/fi";
import api from "../../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    groupName: "",
    memberId: "",
    totalSavings: 0,
    totalLoans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchGroupModal, setShowSwitchGroupModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const storedMemberId = localStorage.getItem("member_id");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!groupId) {
        setLoading(false);
        return;
      }

      const basicProfile = {
        name: user.name || "Member",
        email: user.email || "No email",
        role: role === "admin" ? "Administrator" : "Group Member",
        groupName: localStorage.getItem("selectedGroupName") || "Unknown Group",
        memberId: storedMemberId || "Not assigned",
        totalSavings: 0,
        totalLoans: 0,
      };

      if (role === "member" && storedMemberId) {
        try {
          const savingsRes = await api.get(
            `/savings/member/${groupId}/${storedMemberId}`,
          );
          const loansRes = await api.get(
            `/loans/summary/${groupId}/${storedMemberId}`,
          );
          basicProfile.totalSavings = savingsRes.data.total_savings || 0;
          basicProfile.totalLoans = loansRes.data.total_outstanding || 0;
        } catch (error) {
          console.error("Failed to fetch member data:", error);
        }
      }

      setProfile(basicProfile);
      setLoading(false);
    };

    fetchProfileData();
  }, [groupId, role, storedMemberId, user]);

  // Fetch group members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return;
      setMembersLoading(true);
      try {
        const res = await api.get(`/members/${groupId}`);
        setMembers(res.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [groupId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSwitchGroup = () => {
    navigate("/group-select");
  };

  const formatMoney = (value) => `K${Number(value).toFixed(2)}`;

  // Generate initials from full name
  const getInitials = (fullName) => {
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return "?";
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (
      nameParts[0].charAt(0).toUpperCase() +
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const avatarInitials = getInitials(profile.name);
  const isMember = profile.role !== "Administrator";

  return (
    <div style={styles.page}>
      {/* Hero header */}
      <div style={styles.heroHeader}>
        <div style={styles.circle1} />
        <div style={styles.circle2} />
        <div style={styles.profileCenter}>
          <div style={styles.avatar}>{avatarInitials}</div>
          <h1 style={styles.profileName}>{profile.name}</h1>
          <p style={styles.profileEmail}>{profile.email}</p>
        </div>
      </div>

      {/* Content card */}
      <div style={styles.contentCard}>
        <div style={styles.infoRow}>
          <FiUsers style={styles.icon} />
          <div>
            <p style={styles.label}>Group Name</p>
            <p style={styles.value}>{profile.groupName}</p>
          </div>
        </div>

        {isMember && profile.memberId && (
          <div style={styles.infoRow}>
            <FiAward style={styles.icon} />
            <div>
              <p style={styles.label}>Member ID</p>
              <p style={styles.value}>{profile.memberId}</p>
            </div>
          </div>
        )}

        {/* Group Members List */}
        <div style={styles.membersSection}>
          <p style={styles.membersTitle}>Group Members</p>
          {membersLoading ? (
            <p style={styles.membersLoading}>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={styles.membersEmpty}>No members found</p>
          ) : (
            <div style={styles.membersList}>
              {members.map((member) => (
                <div key={member.id} style={styles.memberItem}>
                  <div>
                    <p style={styles.memberName}>{member.fullname}</p>
                    <p style={styles.memberPhone}>{member.phone}</p>
                  </div>
                  <div style={styles.memberRole}>
                    {member.role === "admin" ? "Admin" : "Member"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.buttonRow}>
            <button
              onClick={() => setShowSwitchGroupModal(true)}
              style={styles.switchGroupBtn}
            >
              <span>Switch Groups</span>
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={styles.logoutBtn}
            >
              <span>Logout</span>
            </button>
          </div>
          <p style={styles.version}>Umozi Savings | version 26.0.1</p>
        </div>
      </div>

      {/* Switch Group Confirmation Modal */}
      {showSwitchGroupModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Switch Group</h3>
            <p style={styles.modalMessage}>
              Are you sure you want to switch groups?
            </p>
            <div style={styles.modalButtons}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowSwitchGroupModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalSwitchGroupConfirmBtn}
                onClick={() => {
                  setShowSwitchGroupModal(false);
                  handleSwitchGroup();
                }}
              >
                Yes, Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Confirm Logout</h3>
            <p style={styles.modalMessage}>Are you sure you want to log out?</p>
            <div style={styles.modalButtons}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
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

  // Hero header
  heroHeader: {
    background: "#064E3B",
    borderRadius: "0 0 2rem 2rem",
    padding: "2rem 1.5rem 3rem",
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
  profileCenter: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#EA580C",
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  profileName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  profileEmail: {
    fontSize: 14,
    color: "#A7F3D0",
    margin: "6px 0 0",
  },

  // Content card
  contentCard: {
    background: "#fff",
    borderRadius: 16,
    margin: "16px 16px 24px",
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #F3F4F6",
  },
  icon: {
    color: "#6B7280",
    fontSize: 18,
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#9CA3AF",
    margin: 0,
    letterSpacing: "0.05em",
  },
  value: {
    fontSize: 15,
    fontWeight: 500,
    color: "#1F2937",
    margin: 0,
  },

  // Members section
  membersSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#9CA3AF",
    margin: "0 0 12px 0",
    letterSpacing: "0.05em",
  },
  membersLoading: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    padding: "20px 0",
  },
  membersEmpty: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    padding: "20px 0",
  },
  membersList: {
    maxHeight: 300,
    overflowY: "auto",
    border: "1px solid #F3F4F6",
    borderRadius: 12,
  },
  memberItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #F3F4F6",
    ":last-child": {
      borderBottom: "none",
    },
  },
  memberName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1F2937",
    margin: 0,
  },
  memberPhone: {
    fontSize: 12,
    color: "#9CA3AF",
    margin: "2px 0 0",
  },
  memberRole: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    background: "#ECFDF5",
    color: "#059669",
  },

  footer: {
    borderTop: "1px solid #E5E7EB",
    paddingTop: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
  },
  switchGroupBtn: {
    background: "transparent",
    color: "#D97706",
    border: "1.5px solid #D97706",
    borderRadius: 40,
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s ease",
  },
  logoutBtn: {
    background: "transparent",
    color: "#EF4444",
    border: "1.5px solid #EF4444",
    borderRadius: 40,
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s ease",
  },
  version: {
    fontSize: 10,
    color: "#9CA3AF",
    margin: 0,
    letterSpacing: "0.02em",
  },

  // Modal styles (shared)
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalCard: {
    background: "#fff",
    borderRadius: 24,
    padding: "24px",
    width: "90%",
    maxWidth: 320,
    textAlign: "center",
    position: "relative",
    boxShadow: "0 20px 35px rgba(0,0,0,0.2)",
  },
  modalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#9CA3AF",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
    margin: "0 0 8px",
  },
  modalMessage: {
    fontSize: 14,
    color: "#6B7280",
    margin: "0 0 24px",
  },
  modalButtons: {
    display: "flex",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    background: "transparent",
    border: "1.5px solid #E5E7EB",
    borderRadius: 40,
    padding: "10px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
  },
  modalSwitchGroupConfirmBtn: {
    flex: 1,
    background: "#D97706",
    border: "none",
    borderRadius: 40,
    padding: "10px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  },
  modalConfirmBtn: {
    flex: 1,
    background: "#EF4444",
    border: "none",
    borderRadius: 40,
    padding: "10px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  },
};

// Inject keyframes for spinner
if (!document.querySelector("#profile-spinner-style")) {
  const style = document.createElement("style");
  style.id = "profile-spinner-style";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default Profile;
