const db = require("../config/database");

// ─── Helper: Create a members record for a user ──────────────────────
const createMemberRecord = async (userId, groupId, role = "member") => {
  // Check if a members record already exists
  const [existing] = await db.query(
    "SELECT id FROM members WHERE user_id = ? AND group_id = ?",
    [userId, groupId],
  );
  if (existing.length > 0) return; // already exists

  // Get user's name
  const [user] = await db.query("SELECT name FROM users WHERE id = ?", [
    userId,
  ]);
  const memberName = user[0]?.name || "Member";
  const joinDate = new Date().toISOString().split("T")[0];
  const tempNrc = `temp_${userId}_${Date.now()}`;

  await db.query(
    `INSERT INTO members 
     (group_id, fullname, phone, nrc, address, join_date, created_by, user_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [groupId, memberName, "", tempNrc, "", joinDate, userId, userId],
  );
};

// ─── Create a new group (user becomes admin) ──────────────────────────
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    if (!name) return res.status(400).json({ message: "Group name required" });

    // Generate unique join code
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [rows] = await db.query("SELECT id FROM `groups` WHERE code = ?", [
        code,
      ]);
      if (rows.length === 0) exists = false;
    }

    const [result] = await db.query(
      "INSERT INTO `groups` (name, description, code, created_by) VALUES (?, ?, ?, ?)",
      [name, description || null, code, userId],
    );
    const groupId = result.insertId;

    // Add user as admin to user_groups
    await db.query(
      "INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)",
      [userId, groupId, "admin"],
    );

    // 🔥 Create a members record for the admin
    await createMemberRecord(userId, groupId, "admin");

    res.status(201).json({
      message: "Group created",
      groupId,
      code,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Get all groups the user belongs to ──────────────────────────────
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const [groups] = await db.query(
      `SELECT g.*, ug.role 
       FROM \`groups\` g 
       JOIN user_groups ug ON g.id = ug.group_id 
       WHERE ug.user_id = ?`,
      [userId],
    );
    res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── Join a group using a join code ──────────────────────────────────
const joinGroup = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    if (!code) return res.status(400).json({ message: "Join code required" });

    const [groups] = await db.query("SELECT * FROM `groups` WHERE code = ?", [
      code,
    ]);
    if (groups.length === 0)
      return res.status(404).json({ message: "Invalid group code" });

    const group = groups[0];

    // Check if already in user_groups
    const [existing] = await db.query(
      "SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, group.id],
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: "Already a member of this group" });

    // Insert into user_groups
    await db.query(
      "INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)",
      [userId, group.id, "member"],
    );

    // 🔥 Create a members record for the new member
    await createMemberRecord(userId, group.id, "member");

    res.json({ message: "Successfully joined group", group });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getUserGroups, joinGroup };
