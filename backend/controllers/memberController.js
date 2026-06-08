const db = require("../config/database");

// Get all members for a group – simple & reliable (assumes members table has all records)
const getMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const [members] = await db.query(
      `SELECT m.*, COALESCE(SUM(s.amount), 0) as total_savings 
       FROM members m 
       LEFT JOIN savings s ON m.id = s.member_id AND s.group_id = ? 
       WHERE m.group_id = ? 
       GROUP BY m.id 
       ORDER BY m.created_at DESC`,
      [groupId, groupId],
    );
    res.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single member by ID
const getMemberById = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const [members] = await db.query(
      "SELECT * FROM members WHERE id = ? AND group_id = ?",
      [id, groupId],
    );
    if (members.length === 0)
      return res.status(404).json({ message: "Member not found" });

    const [savings] = await db.query(
      "SELECT SUM(amount) as total FROM savings WHERE member_id = ? AND group_id = ?",
      [id, groupId],
    );
    const [savingsHistory] = await db.query(
      "SELECT * FROM savings WHERE member_id = ? AND group_id = ? ORDER BY date DESC LIMIT 10",
      [id, groupId],
    );
    const [loans] = await db.query(
      `SELECT l.*, COALESCE(SUM(r.amount_paid), 0) as paid_amount,
                    (l.amount + (l.amount * l.interest_rate / 100)) - COALESCE(SUM(r.amount_paid), 0) as remaining
             FROM loans l
             LEFT JOIN repayments r ON l.id = r.loan_id
             WHERE l.member_id = ? AND l.group_id = ? AND l.status = 'active'
             GROUP BY l.id`,
      [id, groupId],
    );
    res.json({
      ...members[0],
      total_savings: savings[0]?.total || 0,
      savings_history: savingsHistory,
      active_loans: loans,
    });
  } catch (error) {
    console.error("Get member by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new member (full details – admin only)
const createMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fullname, phone, nrc, address, join_date, photo } = req.body;
    const userId = req.user.id;

    const [existing] = await db.query(
      "SELECT id FROM members WHERE nrc = ? AND group_id = ?",
      [nrc, groupId],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        message: "A member with this NRC already exists in the group",
      });
    }

    const [result] = await db.query(
      "INSERT INTO members (group_id, fullname, phone, nrc, address, join_date, photo, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        groupId,
        fullname,
        phone,
        nrc,
        address || null,
        join_date,
        photo || null,
        userId,
      ],
    );
    res
      .status(201)
      .json({ message: "Member created", memberId: result.insertId });
  } catch (error) {
    console.error("Create member error:", error);
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({ message: "Duplicate entry. NRC may already exist." });
    res.status(500).json({ message: error.message });
  }
};

// Update a member
const updateMember = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const { fullname, phone, nrc, address, status } = req.body;
    const [result] = await db.query(
      "UPDATE members SET fullname = ?, phone = ?, nrc = ?, address = ?, status = ? WHERE id = ? AND group_id = ?",
      [fullname, phone, nrc, address, status, id, groupId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member updated" });
  } catch (error) {
    console.error("Update member error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a member
const deleteMember = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const [check] = await db.query(
      'SELECT COUNT(*) as count FROM loans WHERE member_id = ? AND group_id = ? AND status = "active"',
      [id, groupId],
    );
    if (check[0].count > 0)
      return res
        .status(400)
        .json({ message: "Cannot delete member with active loans" });
    const [result] = await db.query(
      "DELETE FROM members WHERE id = ? AND group_id = ?",
      [id, groupId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member deleted" });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Invite a user by email to become a member (admin only)
// FIXED: Creates missing members row instead of error when only user_groups exists
const inviteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const adminId = req.user.id;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1. Find user by email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found. Please ask them to register first.",
      });
    }
    const userId = users[0].id;

    // 2. Ensure user is in user_groups for this group
    const [existingGroup] = await db.query(
      "SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, groupId],
    );

    if (existingGroup.length === 0) {
      await db.query(
        "INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)",
        [userId, groupId, "member"],
      );
    }

    // 3. Check if a members record already exists
    const [memberRec] = await db.query(
      "SELECT * FROM members WHERE user_id = ? AND group_id = ?",
      [userId, groupId],
    );

    if (memberRec.length === 0) {
      // Create missing members record
      const userName = users[0].name;
      const joinDate = new Date().toISOString().split("T")[0];
      const tempNrc = `temp_${userId}_${Date.now()}`; // unique temporary NRC
      await db.query(
        `INSERT INTO members 
         (group_id, fullname, phone, nrc, address, join_date, created_by, user_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [groupId, userName, "", tempNrc, "", joinDate, adminId, userId],
      );
      return res.json({ message: "User added as member successfully" });
    } else {
      // Both user_groups and members exist → truly duplicate
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });
    }
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get member_id for the logged-in user in a specific group
const getMemberIdByUser = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const [member] = await db.query(
      "SELECT id FROM members WHERE group_id = ? AND user_id = ?",
      [groupId, userId],
    );
    if (member.length === 0) {
      return res
        .status(404)
        .json({ message: "Member not found for this group" });
    }
    res.json({ member_id: member[0].id });
  } catch (error) {
    console.error("Get member ID by user error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  inviteMember,
  getMemberIdByUser,
};
