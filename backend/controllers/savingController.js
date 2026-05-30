const db = require("../config/database");

const addSaving = async (req, res) => {
  try {
    const { groupId, member_id, amount, payment_method, date, notes } =
      req.body;
    const userId = req.user.id;
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
    res.status(500).json({ message: error.message });
  }
};

const getMemberSavings = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
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
    res.status(500).json({ message: error.message });
  }
};

const getAllSavings = async (req, res) => {
  try {
    const { groupId } = req.params;
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addSaving, getMemberSavings, getAllSavings };
