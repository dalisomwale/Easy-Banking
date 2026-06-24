const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ========================
   CORS CONFIG (PRODUCTION)
======================== */
const allowedOrigins = [
  "https://www.umozisavings.com",
  "https://umozisavings.com",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked for this origin"));
      }
    },
    credentials: true,
  }),
);

/* ========================
   MIDDLEWARE
======================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========================
   ROUTES
======================== */

// Import routes
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const memberRoutes = require("./routes/memberRoutes");
const savingRoutes = require("./routes/savingRoutes");
const loanRoutes = require("./routes/loanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const fineRoutes = require("./routes/fineRoutes");
const shareOutRoutes = require("./routes/shareOutRoutes");

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/share-out", shareOutRoutes);

/* ========================
   HEALTH CHECK
======================== */
app.get("/", (req, res) => {
  res.json({
    message: "Umozi Savings API is running",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* ========================
   HANDLE INVALID ROUTES
======================== */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ========================
   GLOBAL ERROR HANDLER
======================== */
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* ========================
   START SERVER
======================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
