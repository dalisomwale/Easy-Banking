const express = require("express");
const {
  createGroup,
  getUserGroups,
  joinGroup,
} = require("../controllers/groupController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

router.post("/create", createGroup);
router.get("/", getUserGroups);
router.post("/join", joinGroup);

module.exports = router;
