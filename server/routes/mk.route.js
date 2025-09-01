const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const mkController = require("../controllers/mk.controller");
const router = express.Router();

router.get("/", mkController.getAll);
router.get("/penilaian", mkController.getMkPenilaian);
router.get("/:id", mkController.getById);
router.post("/", isAuthenticated, mkController.create);
router.patch("/:id", isAuthenticated, mkController.update);

module.exports = router;
