const express = require("express");
const {
  addSaving,
  getMemberSavings,
  getAllSavings,
} = require("../controllers/savingController");
const { protect } = require("../middleware/auth");
const router = express.Router();
router.use(protect);
router.post("/", addSaving);
router.get("/all/:groupId", getAllSavings);
router.get("/member/:groupId/:memberId", getMemberSavings);
module.exports = router;
