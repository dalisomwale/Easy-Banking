import axios from "axios";
import toast from "react-hot-toast";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://umozi-savings.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor – add token and groupId
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const groupId = localStorage.getItem("selectedGroupId");

  const skipGroupEndpoints = ["/groups", "/auth"];

  const shouldSkip = skipGroupEndpoints.some(
    (ep) => config.url && config.url.includes(ep)
  );

  if (groupId && !shouldSkip) {
    if (
      config.method === "post" ||
      config.method === "put" ||
      config.method === "patch"
    ) {
      config.data = {
        ...config.data,
        groupId,
      };
    } else {
      config.params = {
        ...config.params,
        groupId,
      };
    }
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    console.error(`API Error [${status}] ${url}:`, error.response?.data);

    if (status === 401) {
      toast.error(
        "Authentication failed. Please log in again if the problem persists."
      );
    }

    if (
      status === 400 &&
      error.response?.data?.message?.includes("groupId")
    ) {
      toast.error(
        "Please select a group before performing this action."
      );
    }

    return Promise.reject(error);
  }
);

export default api;