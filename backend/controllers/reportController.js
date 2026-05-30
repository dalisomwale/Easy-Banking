const db = require("../config/database");

// Helper to safely convert to number
const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Admin dashboard: group-level statistics
const getDashboardStats = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Total active members
    const [members] = await db.query(
      'SELECT COUNT(*) as count FROM members WHERE group_id = ? AND status = "active"',
      [groupId],
    );

    // Total savings in the group
    const [savings] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE group_id = ?",
      [groupId],
    );

    // Active loans count and total amount
    const [activeLoans] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount FROM loans WHERE group_id = ? AND status = "active"',
      [groupId],
    );

    // Total repayments made in the group
    const [repayments] = await db.query(
      "SELECT COALESCE(SUM(amount_paid), 0) as total FROM repayments r JOIN loans l ON r.loan_id = l.id WHERE l.group_id = ?",
      [groupId],
    );

    const totalSavings = toNumber(savings[0]?.total);
    const totalRepayments = toNumber(repayments[0]?.total);
    const totalFunds = totalSavings + totalRepayments;

    // Recent 5 savings
    const [recentSavings] = await db.query(
      `SELECT 'saving' as type, s.amount, s.date, m.fullname as member_name
       FROM savings s JOIN members m ON s.member_id = m.id
       WHERE s.group_id = ? ORDER BY s.date DESC LIMIT 5`,
      [groupId],
    );

    // Recent 5 repayments
    const [recentRepayments] = await db.query(
      `SELECT 'repayment' as type, r.amount_paid as amount, r.payment_date as date, m.fullname as member_name
       FROM repayments r
       JOIN loans l ON r.loan_id = l.id
       JOIN members m ON l.member_id = m.id
       WHERE l.group_id = ? ORDER BY r.payment_date DESC LIMIT 5`,
      [groupId],
    );

    const recentTransactions = [...recentSavings, ...recentRepayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      total_members: members[0].count,
      total_savings: totalSavings,
      active_loans_count: activeLoans[0]?.count || 0,
      total_loans_amount: toNumber(activeLoans[0]?.total_amount),
      total_repayments: totalRepayments,
      total_funds: totalFunds,
      recent_transactions: recentTransactions.map((tx) => ({
        ...tx,
        amount: toNumber(tx.amount),
      })),
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Financial summary for charts (admin only)
const getFinancialSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [savingsByMonth] = await db.query(
      `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as total
       FROM savings WHERE group_id = ? AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month DESC`,
      [groupId],
    );
    const [loansByMonth] = await db.query(
      `SELECT DATE_FORMAT(issue_date, '%Y-%m') as month, COUNT(*) as count, SUM(amount) as total
       FROM loans WHERE group_id = ? AND issue_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(issue_date, '%Y-%m') ORDER BY month DESC`,
      [groupId],
    );
    res.json({
      savings_by_month: savingsByMonth,
      loans_by_month: loansByMonth,
    });
  } catch (error) {
    console.error("getFinancialSummary error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Member dashboard: personal savings and outstanding loan balance
const getMemberDashboardStats = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    // Verify that this member belongs to the logged-in user
    const [memberCheck] = await db.query(
      "SELECT id FROM members WHERE id = ? AND group_id = ? AND user_id = ?",
      [memberId, groupId, userId],
    );
    if (memberCheck.length === 0) {
      return res
        .status(403)
        .json({ message: "Access denied – member not linked to your account" });
    }

    // Total savings for this member
    const [savingsResult] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE member_id = ? AND group_id = ?",
      [memberId, groupId],
    );
    const totalSavings = toNumber(savingsResult[0].total_savings);

    // Outstanding loan balance (principal + interest - total paid) for active loans only
    const [loanSummary] = await db.query(
      `SELECT COALESCE(SUM(
        (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0)
      ), 0) as total_outstanding
       FROM loans l
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.member_id = ? AND l.group_id = ? AND l.status = 'active'
       GROUP BY l.id`,
      [memberId, groupId],
    );
    const totalOutstanding = toNumber(loanSummary[0]?.total_outstanding || 0);

    // Recent transactions (last 5 savings + last 5 repayments)
    const [recentSavings] = await db.query(
      `SELECT 'saving' as type, amount, date, notes as description
       FROM savings 
       WHERE member_id = ? AND group_id = ?
       ORDER BY date DESC LIMIT 5`,
      [memberId, groupId],
    );
    const [recentRepayments] = await db.query(
      `SELECT 'repayment' as type, r.amount_paid as amount, r.payment_date as date, CONCAT('Loan #', l.id) as description
       FROM repayments r
       JOIN loans l ON r.loan_id = l.id
       WHERE l.member_id = ? AND l.group_id = ?
       ORDER BY r.payment_date DESC LIMIT 5`,
      [memberId, groupId],
    );

    const recentTransactions = [...recentSavings, ...recentRepayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      total_savings: totalSavings,
      total_outstanding: totalOutstanding,
      recent_transactions: recentTransactions.map((tx) => ({
        ...tx,
        amount: toNumber(tx.amount),
      })),
    });
  } catch (error) {
    console.error("getMemberDashboardStats error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getFinancialSummary,
  getMemberDashboardStats,
};
