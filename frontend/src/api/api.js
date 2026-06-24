import axios from "axios";

// Backend URL (Render)
const API = axios.create({
  baseURL: "https://umozi-savings.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// OPTIONAL: attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
