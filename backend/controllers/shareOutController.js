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

// ─── Helper: Calculate share-out for a cycle ──────────────────────────

const calculateCycleShareOut = async (cycleId, groupId) => {
  // Fetch all members with their total savings
  const [members] = await db.query(
    `SELECT m.id, m.fullname,
            COALESCE(SUM(s.amount), 0) as total_savings
     FROM members m
     LEFT JOIN savings s ON s.member_id = m.id AND s.group_id = ?
     WHERE m.group_id = ?
     GROUP BY m.id`,
    [groupId, groupId],
  );

  // Get cycle details
  const [cycle] = await db.query(
    "SELECT * FROM share_out_cycles WHERE id = ? AND group_id = ?",
    [cycleId, groupId],
  );
  if (!cycle.length) throw new Error("Cycle not found");
  const cycleData = cycle[0];

  // Total group savings
  const totalGroupSavings = members.reduce(
    (sum, m) => sum + toNumber(m.total_savings),
    0,
  );

  // Fetch total interest from loans (for this group)
  const [interestResult] = await db.query(
    "SELECT COALESCE(SUM(amount * interest_rate / 100), 0) as total_interest FROM loans WHERE group_id = ?",
    [groupId],
  );
  const totalInterest = toNumber(interestResult[0]?.total_interest);

  // Fetch total fines collected (paid fines)
  const [finesResult] = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total_fines FROM fines WHERE group_id = ? AND status = 'paid'",
    [groupId],
  );
  const totalFines = toNumber(finesResult[0]?.total_fines);

  // Total Fund = Savings + Interest + Fines
  const totalFund = totalGroupSavings + totalInterest + totalFines;

  // Update cycle with calculated totals
  await db.query(
    `UPDATE share_out_cycles 
     SET total_savings = ?, total_interest = ?, total_fines = ?, total_fund = ? 
     WHERE id = ?`,
    [totalGroupSavings, totalInterest, totalFines, totalFund, cycleId],
  );

  // Delete existing share-outs for this cycle (if any)
  await db.query("DELETE FROM share_outs WHERE cycle_id = ?", [cycleId]);

  // Insert share-outs for each member
  if (totalGroupSavings > 0) {
    for (const member of members) {
      const savings = toNumber(member.total_savings);
      const ownershipPct = (savings / totalGroupSavings) * 100;
      const profitEarned = (ownershipPct / 100) * totalInterest; // profit = share of interest
      // Share-out = savings + profit + (share of fines? Usually fines are not distributed as profit, they are added to fund but not returned? The spec says "Fine Contributions Earned" – so we include fines as part of profit? The example given: Total Fund = Savings + Interest + Fines, so yes fines are part of the fund and distributed proportionally.
      // So share-out amount = (ownershipPct/100) * totalFund
      const shareOutAmount = (ownershipPct / 100) * totalFund;

      await db.query(
        `INSERT INTO share_outs 
         (cycle_id, member_id, savings_amount, ownership_percentage, profit_earned, share_out_amount, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          cycleId,
          member.id,
          savings,
          ownershipPct,
          profitEarned,
          shareOutAmount,
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
    total_savings: totalGroupSavings,
    total_interest: totalInterest,
    total_fines: totalFines,
    total_fund: totalFund,
  };
};

// ─── Admin: Create Cycle ──────────────────────────────────────────────

exports.createCycle = async (req, res) => {
  try {
    const { groupId, name, start_date, end_date } = req.body;
    const userId = req.user.id;

    if (!name || !start_date) {
      return res
        .status(400)
        .json({ message: "Name and start date are required" });
    }

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can create cycles" });
    }

    const [result] = await db.query(
      `INSERT INTO share_out_cycles 
       (group_id, name, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
      [groupId, name, start_date, end_date || null, userId],
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

// ─── Admin: Open Cycle ─────────────────────────────────────────────────

exports.openCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can open cycles" });
    }

    await db.query("UPDATE share_out_cycles SET status = 'open' WHERE id = ?", [
      id,
    ]);
    res.json({ message: "Cycle opened" });
  } catch (error) {
    console.error("Open cycle error:", error);
    res
      .status(500)
      .json({ message: "Failed to open cycle", error: error.message });
  }
};

// ─── Admin: Close Cycle ───────────────────────────────────────────────

exports.closeCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id FROM share_out_cycles WHERE id = ?",
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
      "SELECT group_id FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can calculate share-out" });
    }

    const result = await calculateCycleShareOut(id, groupId);
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

// ─── Admin: Recalculate (same as calculate) ──────────────────────────

exports.recalculate = async (req, res) => {
  // Same as calculate, but we can just call calculate
  return exports.calculate(req, res);
};

// ─── Admin: Approve Share-Out ────────────────────────────────────────

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can approve share-out" });
    }

    await db.query(
      "UPDATE share_out_cycles SET status = 'approved' WHERE id = ?",
      [id],
    );
    res.json({ message: "Share-out approved" });
  } catch (error) {
    console.error("Approve error:", error);
    res
      .status(500)
      .json({ message: "Failed to approve share-out", error: error.message });
  }
};

// ─── Admin: Mark as Paid ──────────────────────────────────────────────

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [cycle] = await db.query(
      "SELECT group_id FROM share_out_cycles WHERE id = ?",
      [id],
    );
    if (!cycle.length)
      return res.status(404).json({ message: "Cycle not found" });
    const groupId = cycle[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can mark as paid" });
    }

    await db.query("UPDATE share_out_cycles SET status = 'paid' WHERE id = ?", [
      id,
    ]);
    // Update all member share-outs to 'paid' and set paid_date
    await db.query(
      `UPDATE share_outs 
       SET payment_status = 'paid', paid_date = CURDATE() 
       WHERE cycle_id = ?`,
      [id],
    );
    res.json({ message: "Share-out marked as paid" });
  } catch (error) {
    console.error("Mark paid error:", error);
    res
      .status(500)
      .json({ message: "Failed to mark as paid", error: error.message });
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

    // Get member share-outs
    const [shareOuts] = await db.query(
      `SELECT s.*, m.fullname, m.phone
       FROM share_outs s
       JOIN members m ON s.member_id = m.id
       WHERE s.cycle_id = ?
       ORDER BY s.share_out_amount DESC`,
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

// ─── Admin: Get dashboard stats ───────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can view dashboard" });
    }

    // Total Savings Pool (all savings)
    const [savingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE group_id = ?",
      [groupId],
    );
    const totalSavings = toNumber(savingsRes[0]?.total_savings);

    // Total Loan Interest Earned
    const [interestRes] = await db.query(
      "SELECT COALESCE(SUM(amount * interest_rate / 100), 0) as total_interest FROM loans WHERE group_id = ?",
      [groupId],
    );
    const totalInterest = toNumber(interestRes[0]?.total_interest);

    // Total Fines Collected (paid only)
    const [finesRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_fines FROM fines WHERE group_id = ? AND status = 'paid'",
      [groupId],
    );
    const totalFines = toNumber(finesRes[0]?.total_fines);

    // Total Profit = Interest + Fines (according to spec)
    const totalProfit = totalInterest + totalFines;

    // Total Share-Out Amount (from latest calculated cycle? or all?)
    // For now, we sum all share-outs from all cycles? But spec says "Total Share-Out Amount" likely for current or all cycles.
    // We'll take the latest cycle's total_fund if calculated, else 0.
    const [latestCycle] = await db.query(
      `SELECT total_fund, status 
       FROM share_out_cycles 
       WHERE group_id = ? AND status IN ('calculated','approved','paid')
       ORDER BY created_at DESC LIMIT 1`,
      [groupId],
    );
    const totalShareOut = latestCycle.length
      ? toNumber(latestCycle[0].total_fund)
      : 0;

    // Members Eligible: all members with savings > 0
    const [eligibleMembers] = await db.query(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM members m
       JOIN savings s ON s.member_id = m.id AND s.group_id = ?
       WHERE m.group_id = ?
       GROUP BY m.id
       HAVING SUM(s.amount) > 0`,
      [groupId, groupId],
    );
    const membersEligible = eligibleMembers.length
      ? toNumber(eligibleMembers[0]?.count)
      : 0;

    // Current Cycle Status
    const [currentCycle] = await db.query(
      `SELECT status 
       FROM share_out_cycles 
       WHERE group_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [groupId],
    );
    const currentStatus = currentCycle.length
      ? currentCycle[0].status
      : "No cycle";

    res.json({
      totalSavings,
      totalInterest,
      totalFines,
      totalProfit,
      totalShareOut,
      membersEligible,
      currentStatus,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res
      .status(500)
      .json({ message: "Failed to load stats", error: error.message });
  }
};

// ─── Member: Get my share-out summary ────────────────────────────────

exports.getMemberSummary = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const memberId = await getMemberId(userId, groupId);
    if (!memberId) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Total Savings Contributed
    const [savingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE member_id = ? AND group_id = ?",
      [memberId, groupId],
    );
    const totalSavings = toNumber(savingsRes[0]?.total_savings);

    // Get total group savings
    const [groupSavingsRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE group_id = ?",
      [groupId],
    );
    const groupSavings = toNumber(groupSavingsRes[0]?.total);

    // Ownership Percentage
    const ownershipPct =
      groupSavings > 0 ? (totalSavings / groupSavings) * 100 : 0;

    // Interest Earned (from latest calculated cycle's share-out for this member)
    const [latestShareOut] = await db.query(
      `SELECT s.profit_earned, s.share_out_amount, c.status
       FROM share_outs s
       JOIN share_out_cycles c ON s.cycle_id = c.id
       WHERE s.member_id = ? AND c.group_id = ? AND c.status IN ('calculated','approved','paid')
       ORDER BY c.created_at DESC LIMIT 1`,
      [memberId, groupId],
    );
    let profitEarned = 0;
    let shareOutAmount = 0;
    let cycleStatus = null;
    if (latestShareOut.length) {
      profitEarned = toNumber(latestShareOut[0].profit_earned);
      shareOutAmount = toNumber(latestShareOut[0].share_out_amount);
      cycleStatus = latestShareOut[0].status;
    }

    // Fine Contributions Earned (from fines paid by this member)
    const [finesRes] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_fines FROM fines WHERE member_id = ? AND group_id = ? AND status = 'paid'",
      [memberId, groupId],
    );
    const fineContributions = toNumber(finesRes[0]?.total_fines);

    // Total Share-Out Amount = savings + profit + fine contributions (but in our calculation, the fund includes fines and interest distributed proportionally, so shareOutAmount already includes that)
    // We'll use shareOutAmount from the latest cycle if exists, else compute from current totals.
    // For summary, we can show the latest share-out amount as "Total Share-Out Amount"
    const totalShareOut =
      shareOutAmount > 0
        ? shareOutAmount
        : totalSavings + profitEarned + fineContributions;

    res.json({
      totalSavings,
      ownershipPct,
      profitEarned,
      fineContributions,
      totalShareOut,
      cycleStatus,
    });
  } catch (error) {
    console.error("Member summary error:", error);
    res
      .status(500)
      .json({ message: "Failed to load summary", error: error.message });
  }
};

// ─── Member: Get share-out history (cycles with their share-outs) ────

exports.getMemberHistory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const memberId = await getMemberId(userId, groupId);
    if (!memberId) {
      return res.status(404).json({ message: "Member not found" });
    }

    const [history] = await db.query(
      `SELECT c.id as cycle_id, c.name as cycle_name, c.start_date, c.end_date, c.status,
              s.savings_amount, s.profit_earned, s.share_out_amount, s.payment_status
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

// ─── Member: Get recent share-out activities (from cycles) ────────────

exports.getMemberActivities = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const memberId = await getMemberId(userId, groupId);
    if (!memberId) {
      return res.status(404).json({ message: "Member not found" });
    }

    // We'll track activities in share_out_cycles changes (creation, status changes) and share-outs updated.
    // For simplicity, we'll retrieve the last 5 cycles with status changes.
    const [activities] = await db.query(
      `SELECT c.id, c.name, c.status, c.updated_at,
              CASE 
                WHEN c.status = 'calculated' THEN 'Share-out calculated'
                WHEN c.status = 'approved' THEN 'Share-out approved'
                WHEN c.status = 'paid' THEN 'Share-out paid'
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
