const express = require("express");
const router  = express.Router();
const { register, verifyOtpHandler, resendOtp, login, profile, logout } = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../validators/authValidator");
const auth = require("../middleware/authMiddleware");

router.post("/register",       registerValidation, register);
router.post("/verify-otp",     verifyOtpHandler);
router.post("/resend-otp",     resendOtp);
router.post("/login",          loginValidation,    login);
router.get ("/profile",  auth, profile);
router.post("/logout",   auth, logout);

module.exports = router;
