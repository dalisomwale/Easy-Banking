import React from "react";
import { FiShare2, FiClock } from "react-icons/fi";

// Hero header (same as others)
const HeroHeader = () => (
  <div style={styles.heroHeader}>
    <div style={styles.circle1} />
    <div style={styles.circle2} />
  </div>
);

const Sharings = () => {
  return (
    <div style={styles.page}>
      <HeroHeader />

      <div style={styles.heroCardWrap}>
        <div style={styles.heroCard}>
          <div style={{ flex: 1 }}>
            <p style={styles.heroLabel}>SHARINGS</p>
            <p style={styles.heroAmount}>Coming Soon</p>
            <p style={styles.heroSub}>Profit sharing feature</p>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.comingSoon}>
          <FiClock size={48} color="#9CA3AF" />
          <h3 style={styles.comingSoonTitle}>Feature Coming Soon!</h3>
          <p style={styles.comingSoonText}>
            This feature will be available in the next update. We're working
            hard to bring you profit sharing and distributions.
          </p>
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
  card: {
    background: "#fff",
    borderRadius: 16,
    margin: "16px",
    padding: "40px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  comingSoon: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1F2937",
    margin: 0,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.5,
    margin: 0,
  },
};

export default Sharings;
