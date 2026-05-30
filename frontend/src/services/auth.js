// Utility functions for authentication
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

export const getAdmin = () => {
  const admin = localStorage.getItem("admin");
  return admin ? JSON.parse(admin) : null;
};

export const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};
