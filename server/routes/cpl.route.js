const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const cplController = require("../controllers/cpl.controller");
const router = express.Router();

router.get("/", isAuthenticated, cplController.getAll);
router.post("/", isAuthenticated, cplController.create);
router.patch("/:id", isAuthenticated, cplController.update);

module.exports = router;
