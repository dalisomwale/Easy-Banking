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
  getGroupLoanTotals,
  getTotalInterest, // NEW
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

// Admin endpoints
router.get("/active/:groupId", getActiveLoans);
router.get("/pending/:groupId", getPendingLoans);
router.put("/approve/:loanId", approveLoan);
router.put("/reject/:loanId", rejectLoan);

// Group totals (all roles)
router.get("/group/total/:groupId", getGroupLoanTotals);
router.get("/group/funds/:groupId", getGroupFunds);
router.get("/interest/:groupId", getTotalInterest); // NEW

// Generic loan details (must be last)
router.get("/:groupId/:id", getLoanDetails);

module.exports = router;
