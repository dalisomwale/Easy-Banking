import React from "react";
import Logo from "../Logo"; // ✅ import from Layout folder

const Header = ({ admin, onLogout }) => {
  return (
    <header
      style={{
        background: "rgba(0, 94, 8, 0.82)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        borderBottom: "1px solid rgba(167,243,208,0.2)",
      }}
    >
      <Logo size="default" variant="light" showSubtitle />
    </header>
  );
};

export default Header;
