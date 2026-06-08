const db = require("../config/database");

// Helper: check if user is admin of a group
const isAdmin = async (userId, groupId) => {
  const [adminCheck] = await db.query(
    "SELECT role FROM user_groups WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return adminCheck.length > 0 && adminCheck[0].role === "admin";
};

// Helper: get member_id for a user in a group
const getMemberId = async (userId, groupId) => {
  const [member] = await db.query(
    "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  return member.length ? member[0].id : null;
};

// Add a saving – must be for the logged-in member (or admin can add for others? We'll restrict to own)
const addSaving = async (req, res) => {
  try {
    const { groupId, member_id, amount, payment_method, date, notes } =
      req.body;
    const userId = req.user.id;

    // Verify that the member_id belongs to the logged-in user (unless admin)
    const isAdminUser = await isAdmin(userId, groupId);
    const ownMemberId = await getMemberId(userId, groupId);
    if (!isAdminUser && (!ownMemberId || ownMemberId != member_id)) {
      return res
        .status(403)
        .json({ message: "You can only record savings for yourself" });
    }

    const [result] = await db.query(
      "INSERT INTO savings (group_id, member_id, amount, payment_method, date, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        groupId,
        member_id,
        amount,
        payment_method || "cash",
        date,
        notes || null,
        userId,
      ],
    );
    res
      .status(201)
      .json({ message: "Saving recorded", savingId: result.insertId });
  } catch (error) {
    console.error("addSaving error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get savings for a specific member – only that member's own savings (or admin can view any)
const getMemberSavings = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const isAdminUser = await isAdmin(userId, groupId);
    const ownMemberId = await getMemberId(userId, groupId);
    if (!isAdminUser && (!ownMemberId || ownMemberId != memberId)) {
      return res
        .status(403)
        .json({ message: "You can only view your own savings" });
    }

    const [savings] = await db.query(
      "SELECT * FROM savings WHERE member_id = ? AND group_id = ? ORDER BY date DESC",
      [memberId, groupId],
    );
    const [total] = await db.query(
      "SELECT SUM(amount) as total FROM savings WHERE member_id = ? AND group_id = ?",
      [memberId, groupId],
    );
    res.json({ savings, total_savings: total[0]?.total || 0 });
  } catch (error) {
    console.error("getMemberSavings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all savings in the group – admin only
const getAllSavings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    if (!(await isAdmin(userId, groupId))) {
      return res
        .status(403)
        .json({ message: "Only admins can view all savings" });
    }

    const { start_date, end_date } = req.query;
    let query = `SELECT s.*, m.fullname FROM savings s JOIN members m ON s.member_id = m.id WHERE s.group_id = ?`;
    let params = [groupId];
    if (start_date && end_date) {
      query += " AND s.date BETWEEN ? AND ?";
      params.push(start_date, end_date);
    }
    query += " ORDER BY s.date DESC LIMIT 100";
    const [savings] = await db.query(query, params);
    const [total] = await db.query(
      "SELECT SUM(amount) as total FROM savings WHERE group_id = ?",
      [groupId],
    );
    res.json({ savings, total_savings: total[0]?.total || 0 });
  } catch (error) {
    console.error("getAllSavings error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get total savings for the group (visible to all members)
const getGroupSavingsTotal = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [total] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total_savings FROM savings WHERE group_id = ?",
      [groupId],
    );
    res.json({ total_savings: toNumber(total[0]?.total_savings || 0) });
  } catch (error) {
    console.error("getGroupSavingsTotal error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper to convert to number
const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

module.exports = {
  addSaving,
  getMemberSavings,
  getAllSavings,
  getGroupSavingsTotal,
};
