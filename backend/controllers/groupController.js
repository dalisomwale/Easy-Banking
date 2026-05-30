const db = require("../config/database");

// Create a new group (user becomes admin)
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
    await db.query(
      "INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)",
      [userId, result.insertId, "admin"],
    );
    res
      .status(201)
      .json({ message: "Group created", groupId: result.insertId, code });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all groups the user belongs to
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

// Join a group using a join code
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
    const [existing] = await db.query(
      "SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?",
      [userId, group.id],
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: "Already a member of this group" });

    await db.query(
      "INSERT INTO user_groups (user_id, group_id, role) VALUES (?, ?, ?)",
      [userId, group.id, "member"],
    );
    res.json({ message: "Successfully joined group", group });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGroup, getUserGroups, joinGroup };
