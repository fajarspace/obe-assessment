const express = require("express");
const passport = require("passport");
const { isAuthenticated, rillAuthCoy } = require("../middleware/auth");
const authController = require("../controllers/users.controller");

const router = express.Router();

// Rute untuk login menggunakan Google
router.get(
  "/google",
  rillAuthCoy,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback setelah login berhasil
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: false }),
  authController.handleGoogleCallback
);

// Logout user
router.get("/google/logout", authController.logout);

// Mendapatkan data user saat ini
router.get("/google/me", isAuthenticated, authController.getLoggedInUser);

router.get("/profile", authController.getAllusers);

router.post("/create-dummy", authController.createUser);

// Update profile user (phone_number dan whoami)
router.patch("/profile", isAuthenticated, authController.updateProfile);

router.patch(
  "/profile-admin/:id",
  isAuthenticated,
  authController.updateProfileByAdmin
);

router.delete("/profile/:id", isAuthenticated, authController.deleteProfile);

module.exports = router;
