const express = require("express");
const {
  requestLoan,
  approveLoan,
  rejectLoan,
  getActiveLoans,
  getPendingLoans,
  getActiveLoansForMember,
  getLoanSummary,
  getLoanHistory,
  recordRepayment,
  getLoanDetails,
  getGroupFunds,
  getGroupLoanTotals, // new
} = require("../controllers/loanController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

// Member endpoints
router.post("/request", requestLoan);
router.post("/repayment", recordRepayment);
router.get("/active-for-member/:groupId/:member_id", getActiveLoansForMember);
router.get("/summary/:groupId/:member_id", getLoanSummary);
router.get("/history/:groupId/:member_id", getLoanHistory);

// Admin endpoints – must be before generic :groupId/:id
router.get("/active/:groupId", getActiveLoans);
router.get("/pending/:groupId", getPendingLoans);
router.put("/approve/:loanId", approveLoan);
router.put("/reject/:loanId", rejectLoan);

// Group totals (visible to all)
router.get("/group/total/:groupId", getGroupLoanTotals);
router.get("/group/funds/:groupId", getGroupFunds);

// Generic loan details (must be last)
router.get("/:groupId/:id", getLoanDetails);

module.exports = router;
