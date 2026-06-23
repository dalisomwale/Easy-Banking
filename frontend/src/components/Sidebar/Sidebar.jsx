import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
  FiRefreshCw,
} from "react-icons/fi";
import Logo from "../Logo"; // ✅ import from Layout folder

const Sidebar = ({ admin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupName = localStorage.getItem("selectedGroupName");
  const groupRole = localStorage.getItem("selectedGroupRole");
  const isAdmin = groupRole === "admin";

  const navItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/app/savings/add", label: "Add Saving", icon: FiTrendingUp },
    { path: "/app/loans", label: "Loans", icon: FiBookOpen },
    { path: "/app/members", label: "Members", icon: FiUsers },
  ];
  if (isAdmin) {
    navItems.push({
      path: "/app/reports",
      label: "Reports",
      icon: FiBarChart2,
    });
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSwitchGroup = () => navigate("/group-select");

  return (
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
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
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
          {admin?.name || "User"}
        </p>
        <p style={{ fontSize: 11, color: "#6EE7B7", margin: "0 0 14px" }}>
          {admin?.email || ""}
        </p>

        <button
          onClick={handleSwitchGroup}
          style={{
            ...footerBtn,
            background: "rgba(217,119,6,0.85)",
            marginBottom: 8,
          }}
        >
          <FiRefreshCw size={14} />
          <span>Switch Group</span>
        </button>

        <button
          onClick={handleLogout}
          style={{ ...footerBtn, background: "rgba(220,38,38,0.8)" }}
        >
          <FiLogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const footerBtn = {
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

export default Sidebar;
