import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiBarChart2,
  FiLogOut,
} from "react-icons/fi";

const Sidebar = ({ admin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupName = localStorage.getItem("selectedGroupName");
  const groupRole = localStorage.getItem("selectedGroupRole");
  const isAdmin = groupRole === "admin";

  const navItems = [
    { path: "/", label: "Dashboard", icon: FiHome },
    { path: "/members", label: "Members", icon: FiUsers },
    { path: "/savings/add", label: "Add Saving", icon: FiDollarSign },
    { path: "/loans", label: "Loans", icon: FiBookOpen },
  ];
  if (isAdmin) {
    navItems.push({ path: "/reports", label: "Reports", icon: FiBarChart2 });
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSwitchGroup = () => navigate("/group-select");

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-emerald-800 text-white flex flex-col z-20 shadow-xl">
      <div className="p-6 border-b border-emerald-700">
        <h2 className="text-2xl font-bold">Easy Banking</h2>
        <p className="text-emerald-200 text-sm mt-1">
          {groupName} • {groupRole}
        </p>
      </div>
      <nav className="flex-1 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : "text-emerald-100 hover:bg-emerald-700"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-emerald-700">
        <div className="mb-4">
          <p className="text-sm font-medium">{admin?.name || "User"}</p>
          <p className="text-xs text-emerald-200">{admin?.email || ""}</p>
        </div>
        <button
          onClick={handleSwitchGroup}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-700 rounded-lg hover:bg-amber-600 transition mb-2"
        >
          <FiLogOut className="rotate-90" />
          <span>Switch Group</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-700 rounded-lg hover:bg-red-600 transition"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
