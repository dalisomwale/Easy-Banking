import { Navigate } from "react-router-dom";

const AdminOnly = ({ children }) => {
  const role = localStorage.getItem("selectedGroupRole");
  if (role !== "admin") {
    return <Navigate to="/members" />;
  }
  return children;
};

export default AdminOnly; // <-- MUST BE DEFAULT EXPORT
