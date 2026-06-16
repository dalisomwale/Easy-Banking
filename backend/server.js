const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import route files
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const memberRoutes = require("./routes/memberRoutes");
const savingRoutes = require("./routes/savingRoutes");
const loanRoutes = require("./routes/loanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const fineRoutes = require("./routes/fineRoutes"); // NEW

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/fines", fineRoutes); // NEW

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
