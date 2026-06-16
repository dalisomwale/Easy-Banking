import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiUsers as FiGroup,
  FiUser,
  FiShare2,
  FiAlertTriangle,
  FiPieChart,
} from "react-icons/fi";

const BankLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <path
      d="M4 10L12 3L20 10V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21H6C5.46957 21 4.96086 20.7893 4.58579 20.4142C4.21071 20.0391 4 19.5304 4 19V10Z"
      stroke="#EA580C"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 21V15H16V21"
      stroke="#EA580C"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7V9"
      stroke="#EA580C"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="13" r="1" fill="#EA580C" />
    <circle cx="16" cy="13" r="1" fill="#EA580C" />
    <circle cx="8" cy="13" r="1" fill="#EA580C" />
  </svg>
);

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

  // Build navigation items based on role
  let navItems = [{ path: "/app/dashboard", label: "Home", icon: FiHome }];

  if (isAdmin) {
    navItems.push({ path: "/app/members", label: "Members", icon: FiUsers });
  }

  if (isAdmin) {
    navItems.push(
      { path: "/app/savings/all", label: "Savings", icon: FiDollarSign },
      { path: "/app/loans", label: "Loans", icon: FiBookOpen },
      { path: "/app/fines", label: "Fines", icon: FiAlertTriangle },
      { path: "/app/share-outs", label: "Share-Outs", icon: FiPieChart },
      { path: "/app/reports", label: "Reports", icon: FiBarChart2 },
    );
  } else {
    navItems.push(
      { path: "/app/savings/add", label: "Savings", icon: FiDollarSign },
      { path: "/app/loans", label: "Loans", icon: FiBookOpen },
      { path: "/app/fines", label: "Fines", icon: FiAlertTriangle },
      { path: "/app/share-out", label: "Share-Out", icon: FiPieChart },
    );
  }
  navItems.push({ path: "/app/profile", label: "Profile", icon: FiUser });

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#F8F9FB", paddingBottom: 72 }}
      >
        <header
          style={{
            background: "rgba(4, 56, 44, 0.85)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(234,88,12,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BankLogo />
            </div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Umozi Savings
            </p>
          </div>
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
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(234,88,12,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BankLogo />
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Umozi Savings
          </p>
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
              "Easy Banking"}
          </h1>
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
