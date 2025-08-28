const express = require("express");
const { isAuthenticated } = require("../middleware/auth");
const subcpmkController = require("../controllers/subcpmk.controller");
const router = express.Router();

router.get("/", isAuthenticated, subcpmkController.getAll);
router.post("/", isAuthenticated, subcpmkController.create);
router.patch("/:id", isAuthenticated, subcpmkController.update);

module.exports = router;
