const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const plController = require("../controllers/pl.controller");
const router = express.Router();

router.get("/", isAuthenticated, plController.getAll);
router.post("/", isAuthenticated, plController.create);
router.patch("/:id", isAuthenticated, plController.update);

module.exports = router;
