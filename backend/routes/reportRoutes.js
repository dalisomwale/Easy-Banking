const express = require("express");
const {
  getDashboardStats,
  getFinancialSummary,
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");
const router = express.Router();
router.use(protect);
router.get("/dashboard/:groupId", getDashboardStats);
router.get("/financial/:groupId", getFinancialSummary);
module.exports = router;
