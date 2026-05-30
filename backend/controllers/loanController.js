const db = require("../config/database");

// Helper to safely convert to number
const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Helper: get total available funds in a group = all savings + all repayments
const getGroupTotalFunds = async (groupId) => {
  const [savingsResult] = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE group_id = ?",
    [groupId],
  );
  const [repaymentsResult] = await db.query(
    `SELECT COALESCE(SUM(r.amount_paid), 0) as total_repayments 
     FROM repayments r 
     JOIN loans l ON r.loan_id = l.id 
     WHERE l.group_id = ?`,
    [groupId],
  );
  const totalSavings = toNumber(savingsResult[0]?.total_savings);
  const totalRepayments = toNumber(repaymentsResult[0]?.total_repayments);
  return totalSavings + totalRepayments;
};

// Request a loan (member) – now with funds validation
const requestLoan = async (req, res) => {
  try {
    const {
      groupId,
      member_id,
      amount,
      interest_rate,
      duration_months,
      issue_date,
    } = req.body;
    const userId = req.user.id;

    // Validate group funds
    const totalFunds = await getGroupTotalFunds(groupId);
    const requestedAmount = toNumber(amount);
    if (requestedAmount > totalFunds) {
      return res.status(400).json({
        message: `Insufficient group funds. Available: K${totalFunds.toFixed(2)}, Requested: K${requestedAmount.toFixed(2)}`,
      });
    }

    const dueDate = new Date(issue_date);
    dueDate.setMonth(dueDate.getMonth() + parseInt(duration_months));

    const [result] = await db.query(
      `INSERT INTO loans 
       (group_id, member_id, amount, interest_rate, duration_months, issue_date, due_date, status, issued_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        groupId,
        member_id,
        requestedAmount,
        toNumber(interest_rate),
        duration_months,
        issue_date,
        dueDate,
        userId,
      ],
    );

    res
      .status(201)
      .json({ message: "Loan request submitted", loanId: result.insertId });
  } catch (error) {
    console.error("requestLoan error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Approve loan (admin)
const approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const [loan] = await db.query("SELECT group_id FROM loans WHERE id = ?", [
      loanId,
    ]);
    if (!loan.length)
      return res.status(404).json({ message: "Loan not found" });

    const [adminCheck] = await db.query(
      "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, loan[0].group_id],
    );
    if (!adminCheck.length || adminCheck[0].role !== "admin")
      return res.status(403).json({ message: "Only admins can approve loans" });

    await db.query('UPDATE loans SET status = "active" WHERE id = ?', [loanId]);
    res.json({ message: "Loan approved" });
  } catch (error) {
    console.error("approveLoan error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Reject loan (admin)
const rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const [loan] = await db.query("SELECT group_id FROM loans WHERE id = ?", [
      loanId,
    ]);
    if (!loan.length)
      return res.status(404).json({ message: "Loan not found" });

    const [adminCheck] = await db.query(
      "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, loan[0].group_id],
    );
    if (!adminCheck.length || adminCheck[0].role !== "admin")
      return res.status(403).json({ message: "Only admins can reject loans" });

    await db.query('UPDATE loans SET status = "rejected" WHERE id = ?', [
      loanId,
    ]);
    res.json({ message: "Loan rejected" });
  } catch (error) {
    console.error("rejectLoan error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get active loans for admin (group view)
const getActiveLoans = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [loans] = await db.query(
      `SELECT l.*, m.fullname, m.phone,
              COALESCE(SUM(r.amount_paid), 0) as paid_amount,
              (l.amount + (l.amount * l.interest_rate / 100)) as total_due,
              (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
       FROM loans l
       JOIN members m ON l.member_id = m.id
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.group_id = ? AND l.status = 'active'
       GROUP BY l.id
       ORDER BY l.due_date ASC`,
      [groupId],
    );
    const parsed = loans.map((loan) => ({
      ...loan,
      amount: toNumber(loan.amount),
      paid_amount: toNumber(loan.paid_amount),
      total_due: toNumber(loan.total_due),
      remaining: toNumber(loan.remaining),
      interest_rate: toNumber(loan.interest_rate),
    }));
    res.json(parsed);
  } catch (error) {
    console.error("getActiveLoans error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending loans (admin only)
const getPendingLoans = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const [adminCheck] = await db.query(
      "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, groupId],
    );
    if (!adminCheck.length || adminCheck[0].role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can view pending loans" });
    }

    const [loans] = await db.query(
      `SELECT l.*, m.fullname, m.phone
       FROM loans l
       JOIN members m ON l.member_id = m.id
       WHERE l.group_id = ? AND l.status = 'pending'
       ORDER BY l.created_at ASC`,
      [groupId],
    );
    const parsed = loans.map((loan) => ({
      ...loan,
      amount: toNumber(loan.amount),
      interest_rate: toNumber(loan.interest_rate),
    }));
    res.json(parsed);
  } catch (error) {
    console.error("getPendingLoans error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get active loans for a specific member (member view)
const getActiveLoansForMember = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const userId = req.user.id;

    const [member] = await db.query(
      "SELECT id FROM members WHERE id = ? AND group_id = ? AND user_id = ?",
      [member_id, groupId, userId],
    );
    if (!member.length) {
      return res
        .status(403)
        .json({ message: "Access denied – member not linked to your account" });
    }

    const [loans] = await db.query(
      `SELECT l.*, 
              COALESCE(SUM(r.amount_paid), 0) as paid_amount,
              (l.amount + (l.amount * l.interest_rate / 100)) as total_due,
              (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
       FROM loans l
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.group_id = ? AND l.member_id = ? AND l.status = 'active'
       GROUP BY l.id
       ORDER BY l.due_date ASC`,
      [groupId, member_id],
    );
    const parsed = loans.map((loan) => ({
      ...loan,
      amount: toNumber(loan.amount),
      paid_amount: toNumber(loan.paid_amount),
      total_due: toNumber(loan.total_due),
      remaining: toNumber(loan.remaining),
      interest_rate: toNumber(loan.interest_rate),
    }));
    res.json(parsed);
  } catch (error) {
    console.error("getActiveLoansForMember error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get loan summary (total outstanding for a member)
const getLoanSummary = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const [result] = await db.query(
      `SELECT COALESCE(SUM(remaining), 0) as total_outstanding
       FROM (
         SELECT (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
         FROM loans l
         LEFT JOIN repayments r ON l.id = r.loan_id
         WHERE l.group_id = ? AND l.member_id = ? AND l.status = 'active'
         GROUP BY l.id
       ) AS loan_balances`,
      [groupId, member_id],
    );
    res.json({
      total_outstanding: toNumber(result[0]?.total_outstanding || 0),
    });
  } catch (error) {
    console.error("getLoanSummary error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get loan history for a member
const getLoanHistory = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const [loans] = await db.query(
      `SELECT l.*, 
              COALESCE(SUM(r.amount_paid), 0) as paid_amount,
              (l.amount + (l.amount * l.interest_rate / 100)) as total_due,
              (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
       FROM loans l
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.group_id = ? AND l.member_id = ?
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [groupId, member_id],
    );
    const parsed = loans.map((loan) => ({
      ...loan,
      amount: toNumber(loan.amount),
      paid_amount: toNumber(loan.paid_amount),
      total_due: toNumber(loan.total_due),
      remaining: toNumber(loan.remaining),
      interest_rate: toNumber(loan.interest_rate),
    }));
    res.json(parsed);
  } catch (error) {
    console.error("getLoanHistory error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Record a repayment (includes interest validation)
const recordRepayment = async (req, res) => {
  try {
    const { loan_id, amount_paid, payment_date, payment_method } = req.body;
    const userId = req.user.id;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [loan] = await connection.query(
        `SELECT l.*, COALESCE(SUM(r.amount_paid), 0) as total_paid
         FROM loans l
         LEFT JOIN repayments r ON l.id = r.loan_id
         WHERE l.id = ? GROUP BY l.id`,
        [loan_id],
      );
      if (loan.length === 0) throw new Error("Loan not found");

      const loanData = loan[0];
      const principal = toNumber(loanData.amount);
      const interestRate = toNumber(loanData.interest_rate);
      const totalAmount = principal + (principal * interestRate) / 100;
      const currentPaid = toNumber(loanData.total_paid);
      const newPayment = toNumber(amount_paid);
      const newTotalPaid = currentPaid + newPayment;

      if (newPayment <= 0)
        throw new Error("Payment amount must be greater than zero");
      if (newTotalPaid > totalAmount) {
        const maxAllowed = totalAmount - currentPaid;
        throw new Error(
          `Payment exceeds remaining balance. Maximum allowed: ${maxAllowed.toFixed(2)}`,
        );
      }

      await connection.query(
        "INSERT INTO repayments (loan_id, amount_paid, payment_date, payment_method, recorded_by) VALUES (?, ?, ?, ?, ?)",
        [loan_id, newPayment, payment_date, payment_method || "cash", userId],
      );

      if (newTotalPaid >= totalAmount) {
        await connection.query(
          'UPDATE loans SET status = "paid" WHERE id = ?',
          [loan_id],
        );
      }

      await connection.commit();
      res.json({ message: "Repayment recorded successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("recordRepayment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get full loan details including repayments
const getLoanDetails = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const [loans] = await db.query(
      `SELECT l.*, m.fullname, m.phone, m.nrc
       FROM loans l
       JOIN members m ON l.member_id = m.id
       WHERE l.id = ? AND l.group_id = ?`,
      [id, groupId],
    );
    if (loans.length === 0)
      return res.status(404).json({ message: "Loan not found" });

    const loan = loans[0];
    const amount = toNumber(loan.amount);
    const interestRate = toNumber(loan.interest_rate);
    const totalAmount = amount + (amount * interestRate) / 100;

    const [repayments] = await db.query(
      "SELECT * FROM repayments WHERE loan_id = ? ORDER BY payment_date DESC",
      [id],
    );
    const totalPaid = repayments.reduce(
      (sum, r) => sum + toNumber(r.amount_paid),
      0,
    );
    const remaining = totalAmount - totalPaid;

    res.json({
      ...loan,
      amount,
      interest_rate: interestRate,
      total_amount: totalAmount,
      total_paid: totalPaid,
      remaining,
      repayments: repayments.map((r) => ({
        ...r,
        amount_paid: toNumber(r.amount_paid),
      })),
    });
  } catch (error) {
    console.error("getLoanDetails error:", error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: Get total funds for a group (used by dashboard and loan validation)
const getGroupFunds = async (req, res) => {
  try {
    const { groupId } = req.params;
    const totalFunds = await getGroupTotalFunds(groupId);
    res.json({ total_funds: totalFunds });
  } catch (error) {
    console.error("getGroupFunds error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
  getGroupFunds, // NEW
};
