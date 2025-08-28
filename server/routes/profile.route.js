const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const profileController = require("../controllers/profile.controller");
const router = express.Router();

router.get("/", profileController.getAllProfile);
router.post("/", isAuthenticated, profileController.createProfile);
router.patch("/:id", isAuthenticated, profileController.updateProfile);

module.exports = router;
