const express = require("express");
const {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  issueFine,
  payFine,
  getMemberFines,
  getAllFines,
  getFineStats,
  getFineSummary,
} = require("../controllers/fineController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// ─── Rules ──────────────────────────────────────────────────────────────
// Admin only (write)
router.post("/rules", createRule);
router.put("/rules/:id", updateRule);
router.delete("/rules/:id", deleteRule);
// Anyone (read)
router.get("/rules/:groupId", listRules);

// ─── Fines ──────────────────────────────────────────────────────────────
router.post("/issue", issueFine); // admin only
router.put("/pay/:id", payFine); // admin only

// View fines
router.get("/member/:groupId/:memberId", getMemberFines); // member own or admin for specific
router.get("/group/:groupId", getAllFines); // admin only

// Statistics
router.get("/stats/:groupId", getFineStats); // admin only
router.get("/summary/:groupId/:memberId", getFineSummary); // member own summary

module.exports = router;
