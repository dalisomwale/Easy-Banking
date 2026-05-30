const express = require("express");
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  inviteMember,
  getMemberIdByUser,
} = require("../controllers/memberController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Invite member by email (admin only)
router.post("/invite/:groupId", inviteMember);

// Get member ID for the logged-in user in a group
router.get("/member-id/:groupId", getMemberIdByUser);

// CRUD operations
router.get("/:groupId", getMembers);
router.get("/:groupId/:id", getMemberById);
router.post("/:groupId", createMember);
router.put("/:groupId/:id", updateMember);
router.delete("/:groupId/:id", deleteMember);

module.exports = router;
