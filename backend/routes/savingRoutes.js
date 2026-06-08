const express = require("express");
const {
  addSaving,
  getMemberSavings,
  getAllSavings,
  getGroupSavingsTotal, // new
} = require("../controllers/savingController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.post("/", addSaving);
router.get("/all/:groupId", getAllSavings); // admin only
router.get("/member/:groupId/:memberId", getMemberSavings); // member's own or admin
router.get("/group/total/:groupId", getGroupSavingsTotal); // everyone

module.exports = router;
