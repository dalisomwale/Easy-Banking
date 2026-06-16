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

// ─── RULES ──────────────────────────────────────────────────────────────

exports.createRule = async (req, res) => {
  try {
    const { groupId, name, description, amount, status } = req.body;
    const userId = req.user.id;

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Rule name is required" });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can manage rules" });
    }

    const [result] = await db.query(
      `INSERT INTO fine_rules (group_id, name, description, amount, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        groupId,
        name.trim(),
        description || null,
        amountNum,
        status || "active",
        userId,
      ],
    );

    res.status(201).json({
      message: "Rule created successfully",
      ruleId: result.insertId,
    });
  } catch (error) {
    console.error("Create rule error:", error);
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message:
          "Database schema error: Missing 'group_id' column in fine_rules. Please run migration: ALTER TABLE fine_rules ADD COLUMN group_id INT NOT NULL;",
      });
    }
    res.status(500).json({
      message: "Failed to create rule",
      error: error.message,
    });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount, status } = req.body;
    const userId = req.user.id;

    const [rule] = await db.query(
      "SELECT group_id FROM fine_rules WHERE id = ?",
      [id],
    );
    if (!rule.length)
      return res.status(404).json({ message: "Rule not found" });
    const groupId = rule[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can update rules" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Rule name is required" });
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    await db.query(
      "UPDATE fine_rules SET name = ?, description = ?, amount = ?, status = ? WHERE id = ?",
      [name.trim(), description || null, amountNum, status || "active", id],
    );
    res.json({ message: "Rule updated" });
  } catch (error) {
    console.error("Update rule error:", error);
    res
      .status(500)
      .json({ message: "Failed to update rule", error: error.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rule] = await db.query(
      "SELECT group_id FROM fine_rules WHERE id = ?",
      [id],
    );
    if (!rule.length)
      return res.status(404).json({ message: "Rule not found" });
    const groupId = rule[0].group_id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can delete rules" });
    }

    await db.query("DELETE FROM fine_rules WHERE id = ?", [id]);
    res.json({ message: "Rule deleted" });
  } catch (error) {
    console.error("Delete rule error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete rule", error: error.message });
  }
};

exports.listRules = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [rules] = await db.query(
      "SELECT * FROM fine_rules WHERE group_id = ? ORDER BY created_at DESC",
      [groupId],
    );
    res.json(rules);
  } catch (error) {
    console.error("List rules error:", error);
    res
      .status(500)
      .json({ message: "Failed to load rules", error: error.message });
  }
};

// ─── FINES ──────────────────────────────────────────────────────────────

exports.issueFine = async (req, res) => {
  try {
    const { groupId, member_id, rule_id, amount, reason } = req.body;
    const userId = req.user.id;

    if (!groupId || !member_id || !reason) {
      return res
        .status(400)
        .json({ message: "Group, member, and reason are required" });
    }

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can issue fines" });
    }

    let finalAmount = amount;
    if (rule_id) {
      const [rule] = await db.query(
        "SELECT amount FROM fine_rules WHERE id = ? AND group_id = ?",
        [rule_id, groupId],
      );
      if (rule.length) {
        finalAmount = rule[0].amount;
      } else {
        return res
          .status(400)
          .json({ message: "Selected rule not found in this group" });
      }
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res
          .status(400)
          .json({ message: "Valid amount is required for custom fine" });
      }
      finalAmount = amountNum;
    }

    const [result] = await db.query(
      `INSERT INTO fines (group_id, member_id, rule_id, amount, reason, issued_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [groupId, member_id, rule_id || null, finalAmount, reason.trim(), userId],
    );
    res.status(201).json({ message: "Fine issued", fineId: result.insertId });
  } catch (error) {
    console.error("Issue fine error:", error);
    res
      .status(500)
      .json({ message: "Failed to issue fine", error: error.message });
  }
};

// 🔥 UPDATED: Allow member to pay their own fine
exports.payFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_date } = req.body;
    const userId = req.user.id;

    // Get fine with member info
    const [fine] = await db.query(
      `SELECT f.*, m.user_id, m.group_id 
       FROM fines f 
       JOIN members m ON f.member_id = m.id 
       WHERE f.id = ?`,
      [id],
    );
    if (!fine.length)
      return res.status(404).json({ message: "Fine not found" });
    const fineData = fine[0];

    // Check permission: admin OR the member who owns the fine
    const isAdminUser = await isAdmin(userId, fineData.group_id);
    const isOwner = fineData.user_id === userId;

    if (!isAdminUser && !isOwner) {
      return res.status(403).json({
        message: "You are not authorized to pay this fine",
      });
    }

    // Prevent double payment
    if (fineData.status === "paid") {
      return res.status(400).json({ message: "This fine is already paid" });
    }

    await db.query(
      "UPDATE fines SET status = 'paid', paid_date = ? WHERE id = ?",
      [paid_date || new Date().toISOString().split("T")[0], id],
    );
    res.json({ message: "Fine marked as paid" });
  } catch (error) {
    console.error("Pay fine error:", error);
    res
      .status(500)
      .json({ message: "Failed to pay fine", error: error.message });
  }
};

exports.getMemberFines = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const isAdminUser = await isAdmin(userId, groupId);
    const ownMemberId = await getMemberId(userId, groupId);
    if (!isAdminUser && (!ownMemberId || ownMemberId != memberId)) {
      return res
        .status(403)
        .json({ message: "You can only view your own fines" });
    }

    const [fines] = await db.query(
      `SELECT f.*, r.name as rule_name, u.name as issued_by_name
       FROM fines f
       LEFT JOIN fine_rules r ON f.rule_id = r.id
       LEFT JOIN users u ON f.issued_by = u.id
       WHERE f.member_id = ? AND f.group_id = ?
       ORDER BY f.created_at DESC`,
      [memberId, groupId],
    );
    res.json(fines);
  } catch (error) {
    console.error("Get member fines error:", error);
    res
      .status(500)
      .json({ message: "Failed to load fines", error: error.message });
  }
};

exports.getAllFines = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can view all fines" });
    }

    const [fines] = await db.query(
      `SELECT f.*, m.fullname as member_name, r.name as rule_name, u.name as issued_by_name
       FROM fines f
       JOIN members m ON f.member_id = m.id
       LEFT JOIN fine_rules r ON f.rule_id = r.id
       LEFT JOIN users u ON f.issued_by = u.id
       WHERE f.group_id = ?
       ORDER BY f.created_at DESC`,
      [groupId],
    );
    res.json(fines);
  } catch (error) {
    console.error("Get all fines error:", error);
    res
      .status(500)
      .json({ message: "Failed to load fines", error: error.message });
  }
};

exports.getFineStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res.status(403).json({ message: "Only admins can view stats" });
    }

    const [totalIssued] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE group_id = ?",
      [groupId],
    );
    const [totalPaid] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE group_id = ? AND status = 'paid'",
      [groupId],
    );
    const [outstanding] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE group_id = ? AND status = 'unpaid'",
      [groupId],
    );
    const [membersFined] = await db.query(
      "SELECT COUNT(DISTINCT member_id) as count FROM fines WHERE group_id = ?",
      [groupId],
    );

    res.json({
      total_issued: toNumber(totalIssued[0]?.total),
      total_paid: toNumber(totalPaid[0]?.total),
      outstanding: toNumber(outstanding[0]?.total),
      members_fined: toNumber(membersFined[0]?.count),
    });
  } catch (error) {
    console.error("Get fine stats error:", error);
    res
      .status(500)
      .json({ message: "Failed to load stats", error: error.message });
  }
};

exports.getFineSummary = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const ownMemberId = await getMemberId(userId, groupId);
    if (!ownMemberId || ownMemberId != memberId) {
      return res
        .status(403)
        .json({ message: "You can only view your own summary" });
    }

    const [totalFines] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = ? AND group_id = ?",
      [memberId, groupId],
    );
    const [paidFines] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = ? AND group_id = ? AND status = 'paid'",
      [memberId, groupId],
    );
    const [unpaidFines] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE member_id = ? AND group_id = ? AND status = 'unpaid'",
      [memberId, groupId],
    );

    res.json({
      total_fines: toNumber(totalFines[0]?.total),
      paid_fines: toNumber(paidFines[0]?.total),
      outstanding: toNumber(unpaidFines[0]?.total),
    });
  } catch (error) {
    console.error("Get fine summary error:", error);
    res
      .status(500)
      .json({ message: "Failed to load summary", error: error.message });
  }
};
