import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_URL, timeout: 30000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const groupId = localStorage.getItem("selectedGroupId");
  if (
    groupId &&
    !config.url.includes("/groups") &&
    !config.url.includes("/auth")
  ) {
    // For POST/PUT that send body, we'll add groupId to the body instead of params
    if (config.method === "post" || config.method === "put") {
      config.data = { ...config.data, groupId };
    } else {
      config.params = { ...config.params, groupId };
    }
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export default api;
