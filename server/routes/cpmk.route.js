const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const cpmkController = require("../controllers/cpmk.controller");
const router = express.Router();

router.get("/", isAuthenticated, cpmkController.getAll);
router.post("/", isAuthenticated, cpmkController.create);
router.patch("/:id", isAuthenticated, cpmkController.update);

module.exports = router;
