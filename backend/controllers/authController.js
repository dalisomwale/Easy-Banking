const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// Register a new user (no member record yet)
const register = async (req, res) => {
  try {
    const { name, email, password, nrc, phone, address } = req.body;
    if (!name || !email || !password || !nrc || !phone) {
      return res.status(400).json({
        message: "All fields required: name, email, password, nrc, phone",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user only (no member)
      const [userResult] = await connection.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
      );
      const userId = userResult.insertId;

      await connection.commit();
      res.status(201).json({
        message: "User registered successfully. You can now log in.",
        userId,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Login user (no change)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Find linked member record
    const [member] = await db.query(
      "SELECT id FROM members WHERE user_id = ? LIMIT 1",
      [user.id],
    );
    const memberId = member.length ? member[0].id : null;

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        member_id: memberId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
