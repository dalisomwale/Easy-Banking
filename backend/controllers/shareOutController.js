const db = require("../config/database");

const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));

const isAdmin = async (userId, groupId) => {
  const [rows] = await db.query(
    "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return rows.length > 0 && rows[0].role === "admin";
};

const getMemberId = async (userId, groupId) => {
  const [rows] = await db.query(
    "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return rows.length ? rows[0].id : null;
};

// Helper: Log audit action
const logAction = async (cycleId, userId, action, details = null) => {
  await db.query(
    "INSERT INTO share_out_audit_logs (cycle_id, user_id, action, details) VALUES (?, ?, ?, ?)",
    [cycleId, userId, action, details],
  );
};

// ─── Helper: Calculate share-out for a cycle ──────────────────────────

const calculateCycleShareOut = async (cycleId, groupId) => {
  const [cycle] = await db.query(
    "SELECT * FROM share_out_cycles WHERE id = ? AND group_id = ?",
    [cycleId, groupId],
  );
  if (!cycle.length) throw new Error("Cycle not found");
  const cycleData = cycle[0];

  const startDate = cycleData.start_date;
  const endDate = cycleData.end_date || new Date().toISOString().split("T")[0];

  // 1. Total Savings in cycle
  const [savingsResult] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total_savings 
     FROM savings 
     WHERE group_id = ? AND date BETWEEN ? AND ?`,
    [groupId, startDate, endDate],
  );
  const totalSavings = toNumber(savingsResult[0]?.total_savings);

  // 2. Total Loan Interest from loans issued in cycle
  const [interestResult] = await db.query(
    `SELECT COALESCE(SUM(amount * interest_rate / 100), 0) as total_interest 
     FROM loans 
     WHERE group_id = ? AND issue_date BETWEEN ? AND ?`,
    [groupId, startDate, endDate],
  );
  const totalInterest = toNumber(interestResult[0]?.total_interest);

  // 3. Total Fines paid in cycle
  const [finesResult] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total_fines 
     FROM fines 
     WHERE group_id = ? AND status = 'paid' AND paid_date BETWEEN ? AND ?`,
    [groupId, startDate, endDate],
  );
  const totalFines = toNumber(finesResult[0]?.total_fines);

  const totalFund = totalSavings + totalInterest + totalFines;

  // Update cycle totals
  await db.query(
    `UPDATE share_out_cycles 
     SET total_savings = ?, total_interest = ?, total_fines = ?, total_fund = ? 
     WHERE id = ?`,
    [totalSavings, totalInterest, totalFines, totalFund, cycleId],
  );

  // Delete existing share-outs
  await db.query("DELETE FROM share_outs WHERE cycle_id = ?", [cycleId]);

  // Get all members with savings and outstanding loans
  const [members] = await db.query(
    `SELECT m.id, m.fullname,
            COALESCE(SUM(s.amount), 0) as total_savings,
            COALESCE(
              (SELECT SUM(remaining) FROM (
                SELECT (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
                FROM loans l
                LEFT JOIN repayments r ON l.id = r.loan_id
                WHERE l.member_id = m.id AND l.group_id = ? AND l.status = 'active'
                GROUP BY l.id
              ) AS loan_balances
            ), 0) as outstanding_loan
     FROM members m
     LEFT JOIN savings s ON s.member_id = m.id AND s.group_id = ? AND s.date BETWEEN ? AND ?
     WHERE m.group_id = ?
     GROUP BY m.id`,
    [groupId, groupId, startDate, endDate, groupId],
  );

  if (totalSavings > 0) {
    for (const member of members) {
      const savings = toNumber(member.total_savings);
      const outstandingLoan = toNumber(member.outstanding_loan);
      const ownershipPct = (savings / totalSavings) * 100;
      const grossShareOut = (ownershipPct / 100) * totalFund;
      const profitEarned = grossShareOut - savings;
      const netShareOut = Math.max(0, grossShareOut - outstandingLoan);

      await db.query(
        `INSERT INTO share_outs 
         (cycle_id, member_id, savings_amount, ownership_percentage, outstanding_loan,
          gross_share_out, net_share_out, profit_earned, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cycleId,
          member.id,
          savings,
          ownershipPct,
          outstandingLoan,
          grossShareOut,
          netShareOut,
          profitEarned,
          "pending",
        ],
      );
    }
  }

  // Update cycle status to 'calculated'
  await db.query(
    "UPDATE share_out_cycles SET status = 'calculated' WHERE id = ?",
    [cycleId],
  );

  return {
    total_savings: totalSavings,
    total_interest: totalInterest,
    total_fines: totalFines,
    total_fund: totalFund,
  };
};

// ─── Admin: Create Cycle ──────────────────────────────────────────────

exports.createCycle = async (req, res) => {
  try {
    const {
      groupId,
      name,
      description,
      start_date,
      end_date,
      share_out_date,
      notes,
    } = req.body;
    const userId = req.user.id;

    if (!name || !start_date) {
      return res
        .status(400)
        .json({ message: "Name and start date are required" });
    }

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can create cycles" });
    }

    // Check if there's already an active cycle
    const [activeCycle] = await db.query(
      "SELECT id FROM share_out_cycles WHERE group_id = ? AND status = 'active'",
      [groupId],
    );
    if (activeCycle.length) {
      return res
        .status(400)
        .json({
          message:
            "There is already an active cycle. Please complete it first.",
        });
    }

    const [result] = await db.query(
      `INSERT INTO share_out_cycles 
       (group_id, name, description, start_date, end_date, share_out_date, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        groupId,
        name,
        description || null,
        start_date,
        end_date || null,
        share_out_date || null,
        notes || null,
        userId,
      ],
    );

    await logAction(
      result.insertId,
      userId,
      "created",
      `Cycle "${name}" created`,
    );

    res.status(201).json({
      message: "Cycle created",
      cycleId: result.insertId,
    });
  } catch (error) {
    console.error("Create cycle error:", error);
    res
      .status(500)
      .json({ message: "Failed to create cycle", error: error.message });
  }
};

// ─── Admin: Activate Cycle ────────────────────────────────────────────

exports.activateCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can activate cycles" });
    }

    // Check if another cycle is already active
    const [activeCycle] = await db.query(
      "SELECT id FROM share_out_cycles WHERE group_id = ? AND status = 'active' AND id != ?",
      [groupId, id],
    );
    if (activeCycle.length) {
      return res
        .status(400)
        .json({ message: "Another cycle is already active. Close it first." });
    }

    await db.query(
      "UPDATE share_out_cycles SET status = 'active' WHERE id = ?",
      [id],
    );
    await logAction(
      id,
      userId,
      "activated",
      `Cycle "${cycle[0].name}" activated`,
    );

    res.json({ message: "Cycle activated" });
  } catch (error) {
    console.error("Activate cycle error:", error);
    res
      .status(500)
      .json({ message: "Failed to activate cycle", error: error.message });
  }
};

// ─── Admin: Close Cycle ───────────────────────────────────────────────

exports.closeCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can close cycles" });
    }

    await db.query(
      `UPDATE share_out_cycles 
       SET status = 'closed', end_date = CURDATE() 
       WHERE id = ?`,
      [id],
    );
    await logAction(id, userId, "closed", `Cycle "${cycle[0].name}" closed`);

    res.json({ message: "Cycle closed" });
  } catch (error) {
    console.error("Close cycle error:", error);
    res
      .status(500)
      .json({ message: "Failed to close cycle", error: error.message });
  }
};

// ─── Admin: Calculate Share-Out ──────────────────────────────────────

exports.calculate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;
    const cycleName = cycle[0].name;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can calculate share-out" });
    }

    const result = await calculateCycleShareOut(id, groupId);
    await logAction(
      id,
      userId,
      "calculated",
      `Share-out calculated for "${cycleName}"`,
    );

    res.json({
      message: "Share-out calculated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Calculate error:", error);
    res
      .status(500)
      .json({ message: "Failed to calculate share-out", error: error.message });
  }
};

// ─── Admin: Recalculate ──────────────────────────────────────────────

exports.recalculate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, status, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;
    const currentStatus = cycle[0].status;
    const cycleName = cycle[0].name;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can recalculate" });
    }

    if (
      currentStatus === "approved" ||
      currentStatus === "paid" ||
      currentStatus === "completed"
    ) {
      return res
        .status(400)
        .json({
          message: "Cannot recalculate an approved, paid, or completed cycle",
        });
    }

    const result = await calculateCycleShareOut(id, groupId);
    await logAction(
      id,
      userId,
      "recalculated",
      `Share-out recalculated for "${cycleName}"`,
    );

    res.json({
      message: "Share-out recalculated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Recalculate error:", error);
    res
      .status(500)
      .json({
        message: "Failed to recalculate share-out",
        error: error.message,
      });
  }
};

// ─── Admin: Approve Share-Out ────────────────────────────────────────

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;
    const cycleName = cycle[0].name;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can approve share-out" });
    }

    await db.query(
      "UPDATE share_out_cycles SET status = 'approved' WHERE id = ?",
      [id],
    );
    await logAction(
      id,
      userId,
      "approved",
      `Share-out approved for "${cycleName}"`,
    );

    res.json({ message: "Share-out approved" });
  } catch (error) {
    console.error("Approve error:", error);
    res
      .status(500)
      .json({ message: "Failed to approve share-out", error: error.message });
  }
};

// ─── Admin: Mark Payments ─────────────────────────────────────────────

exports.markPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { memberIds } = req.body;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;
    const cycleName = cycle[0].name;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can mark payments" });
    }

    let whereClause = "";
    let params = [id];
    if (memberIds && memberIds.length) {
      whereClause = " AND member_id IN (?)";
      params.push(memberIds);
    }

    await db.query(
      `UPDATE share_outs 
       SET payment_status = 'paid', paid_date = CURDATE() 
       WHERE cycle_id = ?` + whereClause,
      params,
    );

    // Update cycle status if all members are paid
    const [remaining] = await db.query(
      "SELECT COUNT(*) as count FROM share_outs WHERE cycle_id = ? AND payment_status != 'paid'",
      [id],
    );
    if (remaining[0].count === 0) {
      await db.query(
        "UPDATE share_out_cycles SET status = 'paid' WHERE id = ?",
        [id],
      );
      await logAction(
        id,
        userId,
        "paid",
        `All share-outs paid for "${cycleName}"`,
      );
    } else {
      await logAction(
        id,
        userId,
        "payments_updated",
        `Payments updated for "${cycleName}"`,
      );
    }

    res.json({ message: "Payments updated" });
  } catch (error) {
    console.error("Mark payments error:", error);
    res
      .status(500)
      .json({ message: "Failed to mark payments", error: error.message });
  }
};

// ─── Admin: Complete Cycle ────────────────────────────────────────────

exports.completeCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id, name FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;
    const cycleName = cycle[0].name;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can complete cycles" });
    }

    const [pending] = await db.query(
      "SELECT COUNT(*) as count FROM share_outs WHERE cycle_id = ? AND payment_status != 'paid'",
      [id],
    );
    if (pending[0].count > 0) {
      return res
        .status(400)
        .json({
          message: "All share-outs must be paid before completing the cycle",
        });
    }

    await db.query(
      "UPDATE share_out_cycles SET status = 'completed' WHERE id = ?",
      [id],
    );
    await logAction(id, userId, "completed", `Cycle "${cycleName}" completed`);

    res.json({ message: "Cycle completed" });
  } catch (error) {
    console.error("Complete cycle error:", error);
    res
      .status(500)
      .json({ message: "Failed to complete cycle", error: error.message });
  }
};

// ─── Admin: Get all cycles ────────────────────────────────────────────

exports.getCycles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [cycles] = await db.query(
      `SELECT c.*, u.name as created_by_name
       FROM share_out_cycles c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.group_id = ?
       ORDER BY c.created_at DESC`,
      [groupId],
    );
    res.json(cycles);
  } catch (error) {
    console.error("Get cycles error:", error);
    res
      .status(500)
      .json({ message: "Failed to load cycles", error: error.message });
  }
};

// ─── Admin: Get cycle details with member share-outs ──────────────────

exports.getCycleDetails = async (req, res) => {
  try {
    const { cycleId, groupId } = req.params;
    const [cycles] = await db.query(
      `SELECT c.*, u.name as created_by_name
       FROM share_out_cycles c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = ? AND c.group_id = ?`,
      [cycleId, groupId],
    );
    if (!cycles.length)
      return res.status(404).json({ message: "Cycle not found" });
    const cycle = cycles[0];

    const [shareOuts] = await db.query(
      `SELECT s.*, m.fullname, m.phone
       FROM share_outs s
       JOIN members m ON s.member_id = m.id
       WHERE s.cycle_id = ?
       ORDER BY s.gross_share_out DESC`,
      [cycleId],
    );
    res.json({ cycle, shareOuts });
  } catch (error) {
    console.error("Get cycle details error:", error);
    res
      .status(500)
      .json({ message: "Failed to load cycle details", error: error.message });
  }
};

// ─── Admin: Dashboard stats ───────────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can view dashboard" });
    }

    // Current active cycle
    const [activeCycle] = await db.query(
      `SELECT id, name, status, start_date, end_date 
       FROM share_out_cycles 
       WHERE group_id = ? AND status IN ('active', 'draft')
       ORDER BY created_at DESC LIMIT 1`,
      [groupId],
    );
    const currentCycle = activeCycle.length ? activeCycle[0] : null;

    // Totals (all time)
    const [savingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE group_id = ?",
      [groupId],
    );
    const totalSavings = toNumber(savingsRes[0]?.total);

    const [interestRes] = await db.query(
      "SELECT COALESCE(SUM(amount * interest_rate / 100), 0) as total FROM loans WHERE group_id = ?",
      [groupId],
    );
    const totalInterest = toNumber(interestRes[0]?.total);

    const [finesRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE group_id = ? AND status = 'paid'",
      [groupId],
    );
    const totalFines = toNumber(finesRes[0]?.total);

    const totalFund = totalSavings + totalInterest + totalFines;

    const [eligibleCount] = await db.query(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM members m
       JOIN savings s ON s.member_id = m.id AND s.group_id = ?
       WHERE m.group_id = ?`,
      [groupId, groupId],
    );
    const eligibleMembers = eligibleCount.length
      ? toNumber(eligibleCount[0]?.count)
      : 0;

    const [latestCycle] = await db.query(
      `SELECT total_fund 
       FROM share_out_cycles 
       WHERE group_id = ? AND status IN ('calculated','approved','paid','completed')
       ORDER BY created_at DESC LIMIT 1`,
      [groupId],
    );
    const totalShareOut = latestCycle.length
      ? toNumber(latestCycle[0].total_fund)
      : 0;

    res.json({
      currentCycle,
      totalSavings,
      totalInterest,
      totalFines,
      totalFund,
      eligibleMembers,
      totalShareOut,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({ message: "Failed to load stats", error: error.message });
  }
};

// ─── Member: Get my share-out summary (improved) ──────────────────────

exports.getMemberSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const memberId = await getMemberId(userId, groupId);
    if (!memberId) {
      return res
        .status(404)
        .json({
          message: "Member profile not found. Please contact your group admin.",
        });
    }

    // 1. Total savings for this member (all time)
    const [savingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE member_id = ? AND group_id = ?",
      [memberId, groupId],
    );
    const totalSavings = toNumber(savingsRes[0]?.total);

    // 2. Total group savings (all time)
    const [groupSavingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE group_id = ?",
      [groupId],
    );
    const groupSavings = toNumber(groupSavingsRes[0]?.total);
    const ownershipPct =
      groupSavings > 0 ? (totalSavings / groupSavings) * 100 : 0;

    // 3. Outstanding loan balance
    const [loanSummary] = await db.query(
      `SELECT COALESCE(SUM(remaining), 0) as total_outstanding
       FROM (
         SELECT (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
         FROM loans l
         LEFT JOIN repayments r ON l.id = r.loan_id
         WHERE l.member_id = ? AND l.group_id = ? AND l.status = 'active'
         GROUP BY l.id
       ) AS loan_balances`,
      [memberId, groupId],
    );
    const outstandingLoan = toNumber(loanSummary[0]?.total_outstanding);

    // 4. Get the latest cycle that is not 'draft' (active, closed, calculated, etc.)
    const [latestCycle] = await db.query(
      `SELECT id, name, status, start_date, end_date
       FROM share_out_cycles 
       WHERE group_id = ? AND status != 'draft'
       ORDER BY created_at DESC LIMIT 1`,
      [groupId],
    );

    let cycleName = null;
    let cycleStatus = "No cycle";
    let expectedShareOut = 0;
    let profitEarned = 0;
    let paymentStatus = "No cycle";
    let paidDate = null;

    if (latestCycle.length) {
      const cycle = latestCycle[0];
      cycleName = cycle.name;
      cycleStatus = cycle.status;

      // Check if there is a share-out record for this cycle and this member
      const [shareOut] = await db.query(
        `SELECT s.gross_share_out, s.net_share_out, s.profit_earned, s.payment_status, s.paid_date
         FROM share_outs s
         WHERE s.cycle_id = ? AND s.member_id = ?`,
        [cycle.id, memberId],
      );

      if (shareOut.length) {
        expectedShareOut = toNumber(shareOut[0].net_share_out);
        profitEarned = toNumber(shareOut[0].profit_earned);
        paymentStatus = shareOut[0].payment_status || "pending";
        paidDate = shareOut[0].paid_date;
      } else {
        // No share-out record yet – use cycle status as payment status
        paymentStatus = cycleStatus;
      }
    }

    res.json({
      totalSavings,
      ownershipPct,
      outstandingLoan,
      profitEarned,
      expectedShareOut,
      paymentStatus,
      cycleName,
      paidDate,
    });
  } catch (error) {
    console.error("Member summary error:", error);
    res
      .status(500)
      .json({ message: "Failed to load summary", error: error.message });
  }
};

// ─── Member: Get share-out history ────────────────────────────────────

exports.getMemberHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const memberId = await getMemberId(userId, groupId);
    if (!memberId) {
      return res
        .status(404)
        .json({
          message: "Member profile not found. Please contact your group admin.",
        });
    }

    const [history] = await db.query(
      `SELECT c.id as cycle_id, c.name as cycle_name, c.start_date, c.end_date, c.status,
              s.savings_amount, s.gross_share_out, s.net_share_out, s.profit_earned,
              s.payment_status, s.paid_date
       FROM share_outs s
       JOIN share_out_cycles c ON s.cycle_id = c.id
       WHERE s.member_id = ? AND c.group_id = ?
       ORDER BY c.created_at DESC`,
      [memberId, groupId],
    );
    res.json(history);
  } catch (error) {
    console.error("Member history error:", error);
    res
      .status(500)
      .json({ message: "Failed to load history", error: error.message });
  }
};

// ─── Member: Get recent activities ────────────────────────────────────

exports.getMemberActivities = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [activities] = await db.query(
      `SELECT c.id, c.name, c.status, c.updated_at,
              CASE 
                WHEN c.status = 'draft' THEN 'Cycle created'
                WHEN c.status = 'active' THEN 'Cycle activated'
                WHEN c.status = 'closed' THEN 'Cycle closed'
                WHEN c.status = 'calculated' THEN 'Share-out calculated'
                WHEN c.status = 'approved' THEN 'Share-out approved'
                WHEN c.status = 'paid' THEN 'Share-out paid'
                WHEN c.status = 'completed' THEN 'Cycle completed'
                ELSE CONCAT('Cycle ', c.status)
              END as activity
       FROM share_out_cycles c
       WHERE c.group_id = ?
       ORDER BY c.updated_at DESC
       LIMIT 5`,
      [groupId],
    );
    res.json(activities);
  } catch (error) {
    console.error("Member activities error:", error);
    res
      .status(500)
      .json({ message: "Failed to load activities", error: error.message });
  }
};
