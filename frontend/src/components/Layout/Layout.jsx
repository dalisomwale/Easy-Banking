import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiUsers as FiGroup,
  FiUser,
  FiShare2,
  FiAlertTriangle,
  FiPieChart,
} from "react-icons/fi";
import Logo from "./Logo";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const groupName = localStorage.getItem("selectedGroupName");
  const groupRole = localStorage.getItem("selectedGroupRole");
  const groupId = localStorage.getItem("selectedGroupId");
  const isAdmin = groupRole === "admin";

  useEffect(() => {
    if (!groupId) navigate("/group-select");
  }, [groupId, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSwitchGroup = () => navigate("/group-select");

  // ─── Build navigation items (Profile removed) ──────────────────────
  let navItems = [{ path: "/app/dashboard", label: "Home", icon: FiHome }];

  if (isAdmin) {
    navItems.push({ path: "/app/members", label: "Members", icon: FiUsers });
  }

  if (isAdmin) {
    navItems.push(
      { path: "/app/savings/all", label: "Savings", icon: FiTrendingUp },
      { path: "/app/loans", label: "Loans", icon: FiBookOpen },
      { path: "/app/fines", label: "Fines", icon: FiAlertTriangle },
      { path: "/app/share-outs", label: "Share-Outs", icon: FiPieChart },
      { path: "/app/reports", label: "Reports", icon: FiBarChart2 },
    );
  } else {
    navItems.push(
      { path: "/app/savings/add", label: "Savings", icon: FiTrendingUp },
      { path: "/app/loans", label: "Loans", icon: FiBookOpen },
      { path: "/app/fines", label: "Fines", icon: FiAlertTriangle },
      { path: "/app/share-out", label: "Share-Out", icon: FiPieChart },
    );
  }

  // Profile is now in header – removed from navItems

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#F8F9FB", paddingBottom: 72 }}
      >
        <header
          style={{
            background: "#04382C", // solid dark green
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            borderBottom: "1px solid rgba(167,243,208,0.2)",
          }}
        >
          <Logo size="default" variant="light" showSubtitle />

          {/* 🔥 Profile icon – always visible */}
          <FiUser
            color="#fff"
            size={22}
            onClick={() => navigate("/app/profile")}
            style={{ cursor: "pointer" }}
          />
        </header>

        <main>
          <Outlet />
        </main>

        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#ffffff",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-around",
            padding: "8px 0 10px",
            zIndex: 20,
            boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "4px 10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 10,
                  minWidth: 48,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? "#ECFDF5" : "transparent",
                  }}
                >
                  <Icon size={20} color={isActive ? "#059669" : "#9CA3AF"} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#059669" : "#9CA3AF",
                    letterSpacing: "0.02em",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ── DESKTOP ── */
  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FB", display: "flex" }}>
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          width: 240,
          background: "#04382C",
          display: "flex",
          flexDirection: "column",
          zIndex: 20,
          boxShadow: "2px 0 16px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(167,243,208,0.15)",
          }}
        >
          <Logo size="default" variant="light" showSubtitle />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(167,243,208,0.25)",
              borderRadius: 999,
              padding: "3px 10px",
              marginTop: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#34D399",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#A7F3D0", fontWeight: 500 }}>
              {groupName} · {groupRole}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 20px",
                  background: isActive
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
                  border: "none",
                  borderLeft: isActive
                    ? "3px solid #34D399"
                    : "3px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  textAlign: "left",
                }}
              >
                <Icon size={18} color={isActive ? "#fff" : "#6EE7B7"} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "#A7F3D0",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(167,243,208,0.15)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 2px",
            }}
          >
            {user.name}
          </p>
          <p style={{ fontSize: 11, color: "#6EE7B7", margin: "0 0 14px" }}>
            {user.email}
          </p>

          <button
            onClick={handleSwitchGroup}
            style={{
              ...desktopFooterBtn,
              background: "rgba(217,119,6,0.85)",
              marginBottom: 8,
            }}
          >
            <FiGroup size={15} />
            <span>Switch Group</span>
          </button>

          <button
            onClick={handleLogout}
            style={{ ...desktopFooterBtn, background: "rgba(220,38,38,0.8)" }}
          >
            <FiLogOut size={15} />
            <span>Logout</span>
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "rgba(167,243,208,0.4)",
              marginTop: 14,
            }}
          >
            v.26.0.1
          </p>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          marginLeft: 240,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "rgba(4, 56, 44, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(167,243,208,0.2)",
            padding: "16px 24px",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "0 1px 8px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            {navItems.find((i) => i.path === location.pathname)?.label ||
              (location.pathname === "/app/profile"
                ? "Profile"
                : "Easy Banking")}
          </h1>

          {/* 🔥 Profile link – always visible */}
          <div
            onClick={() => navigate("/app/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
            }}
          >
            <FiUser size={18} />
            <span style={{ fontWeight: 500 }}>Profile</span>
          </div>
        </div>

        <main style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const desktopFooterBtn = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px",
  border: "none",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

export default Layout;
