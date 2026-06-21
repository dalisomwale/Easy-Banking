const express = require("express");
const {
  createCycle,
  activateCycle,
  closeCycle,
  calculate,
  recalculate,
  approve,
  markPayments,
  completeCycle,
  getCycles,
  getCycleDetails,
  getDashboardStats,
  getMemberSummary,
  getMemberHistory,
  getMemberActivities,
} = require("../controllers/shareOutController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// Admin routes
router.post("/cycles", createCycle);
router.put("/cycles/activate/:id", activateCycle);
router.put("/cycles/close/:id", closeCycle);
router.post("/cycles/calculate/:id", calculate);
router.post("/cycles/recalculate/:id", recalculate);
router.put("/cycles/approve/:id", approve);
router.put("/cycles/payments/:id", markPayments);
router.put("/cycles/complete/:id", completeCycle);
router.get("/cycles/:groupId", getCycles);
router.get("/cycles/details/:cycleId/:groupId", getCycleDetails);
router.get("/dashboard/:groupId", getDashboardStats);

// Member routes
router.get("/member/summary/:groupId", getMemberSummary);
router.get("/member/history/:groupId", getMemberHistory);
router.get("/member/activities/:groupId", getMemberActivities);

module.exports = router;
