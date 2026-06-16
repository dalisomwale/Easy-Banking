const db = require("../config/database");

// Helper
const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

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
  return (
    toNumber(savingsResult[0]?.total_savings) +
    toNumber(repaymentsResult[0]?.total_repayments)
  );
};

const isAdmin = async (userId, groupId) => {
  const [adminCheck] = await db.query(
    "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return adminCheck.length > 0 && adminCheck[0].role === "admin";
};

const getMemberId = async (userId, groupId) => {
  const [member] = await db.query(
    "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return member.length ? member[0].id : null;
};

// ── Request Loan ──
exports.requestLoan = async (req, res) => {
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

    const realMemberId = await getMemberId(userId, groupId);
    if (!realMemberId || realMemberId != member_id) {
      return res
        .status(403)
        .json({ message: "You can only request loans for yourself" });
    }

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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Approve / Reject ──
exports.approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const [loan] = await db.query("SELECT group_id FROM loans WHERE id = ?", [
      loanId,
    ]);
    if (!loan.length)
      return res.status(404).json({ message: "Loan not found" });
    if (!(await isAdmin(userId, loan[0].group_id))) {
      return res.status(403).json({ message: "Only admins can approve loans" });
    }

    await db.query('UPDATE loans SET status = "active" WHERE id = ?', [loanId]);
    res.json({ message: "Loan approved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const [loan] = await db.query("SELECT group_id FROM loans WHERE id = ?", [
      loanId,
    ]);
    if (!loan.length)
      return res.status(404).json({ message: "Loan not found" });
    if (!(await isAdmin(userId, loan[0].group_id))) {
      return res.status(403).json({ message: "Only admins can reject loans" });
    }

    await db.query('UPDATE loans SET status = "rejected" WHERE id = ?', [
      loanId,
    ]);
    res.json({ message: "Loan rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get active loans (admin) ──
exports.getActiveLoans = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can view all active loans" });
    }

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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get pending loans (admin) ──
exports.getPendingLoans = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Member's active loans ──
exports.getActiveLoansForMember = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const userId = req.user.id;

    const realMemberId = await getMemberId(userId, groupId);
    if (!realMemberId || realMemberId != member_id) {
      return res
        .status(403)
        .json({ message: "You can only view your own loans" });
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Loan summary for member ──
exports.getLoanSummary = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const userId = req.user.id;

    const realMemberId = await getMemberId(userId, groupId);
    if (!realMemberId || realMemberId != member_id) {
      return res
        .status(403)
        .json({ message: "You can only view your own summary" });
    }

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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Loan history for member ──
exports.getLoanHistory = async (req, res) => {
  try {
    const { groupId, member_id } = req.params;
    const userId = req.user.id;

    const realMemberId = await getMemberId(userId, groupId);
    if (!realMemberId || realMemberId != member_id) {
      return res
        .status(403)
        .json({ message: "You can only view your own history" });
    }

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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Record repayment ──
exports.recordRepayment = async (req, res) => {
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

      const isAdminUser = await isAdmin(userId, loanData.group_id);
      const memberId = await getMemberId(userId, loanData.group_id);
      if (!isAdminUser && memberId !== loanData.member_id) {
        throw new Error("You can only repay your own loans");
      }

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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Get loan details with repayments ──
exports.getLoanDetails = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const userId = req.user.id;

    const [loan] = await db.query(
      `SELECT l.*, m.fullname, m.phone, m.nrc
       FROM loans l
       JOIN members m ON l.member_id = m.id
       WHERE l.id = ? AND l.group_id = ?`,
      [id, groupId],
    );
    if (loan.length === 0)
      return res.status(404).json({ message: "Loan not found" });
    const loanData = loan[0];

    const isAdminUser = await isAdmin(userId, groupId);
    const memberId = await getMemberId(userId, groupId);
    if (!isAdminUser && memberId !== loanData.member_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const amount = toNumber(loanData.amount);
    const interestRate = toNumber(loanData.interest_rate);
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
      ...loanData,
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Group funds (all members) ──
exports.getGroupFunds = async (req, res) => {
  try {
    const { groupId } = req.params;
    const totalFunds = await getGroupTotalFunds(groupId);
    res.json({ total_funds: totalFunds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── Group loan totals ──
exports.getGroupLoanTotals = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [result] = await db.query(
      `SELECT 
         COALESCE(SUM(amount), 0) as total_loaned,
         COALESCE(SUM(CASE WHEN status = 'active' THEN amount END), 0) as active_loans
       FROM loans WHERE group_id = ?`,
      [groupId],
    );
    res.json({
      total_loaned: toNumber(result[0]?.total_loaned || 0),
      active_loans: toNumber(result[0]?.active_loans || 0),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ── NEW: Total interest earned (admin only) ──
exports.getTotalInterest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can view interest" });
    }
    const [result] = await db.query(
      "SELECT COALESCE(SUM(amount * interest_rate / 100), 0) as total_interest FROM loans WHERE group_id = ?",
      [groupId],
    );
    res.json({ total_interest: toNumber(result[0]?.total_interest || 0) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
