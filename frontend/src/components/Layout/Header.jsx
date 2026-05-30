import React from "react";
import { FiLogOut } from "react-icons/fi";

const Header = ({ admin, onLogout }) => {
  return (
    <header className="bg-emerald-600 text-white sticky top-0 z-10 shadow-lg">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold">Easy Banking</h1>
          <p className="text-xs text-emerald-100">Village Banking</p>
        </div>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
