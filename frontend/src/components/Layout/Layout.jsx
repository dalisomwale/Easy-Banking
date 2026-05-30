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
} from "react-icons/fi";

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

  const allNavItems = [
    { path: "/", label: "Dashboard", icon: FiHome },
    { path: "/members", label: "Members", icon: FiUsers },
    { path: "/savings/add", label: "Add Saving", icon: FiDollarSign },
    { path: "/loans", label: "Loans", icon: FiBookOpen },
  ];
  const adminNavItems = [
    { path: "/reports", label: "Reports", icon: FiBarChart2 },
  ];
  const navItems = isAdmin ? [...allNavItems, ...adminNavItems] : allNavItems;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-emerald-600 text-white sticky top-0 z-10 shadow-lg">
          <div className="flex justify-between items-center px-4 py-4">
            <div>
              <h1 className="text-xl font-bold">Easy Banking</h1>
              <p className="text-xs text-emerald-100">
                {groupName} • {groupRole}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSwitchGroup}
                className="p-2 hover:bg-emerald-700 rounded-lg transition"
              >
                <FiGroup size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-emerald-700 rounded-lg transition"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        <main className="pb-4">
          <Outlet />
        </main>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 shadow-lg z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/members" &&
                location.pathname.startsWith("/members/")) ||
              (item.path === "/loans" &&
                location.pathname.startsWith("/loans/"));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition ${
                  isActive ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                <Icon size={22} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="fixed left-0 top-0 h-full w-64 bg-emerald-800 text-white flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-emerald-700">
          <h2 className="text-2xl font-bold">Easy Banking</h2>
          <p className="text-sm text-emerald-200 mt-1">
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
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-emerald-200">{user.email}</p>
          </div>
          <button
            onClick={handleSwitchGroup}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-600 transition mb-2"
          >
            <FiGroup />
            <span>Switch Group</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-600 transition"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 ml-64">
        <div className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">
            {navItems.find((i) => i.path === location.pathname)?.label ||
              "Easy Banking"}
          </h1>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
