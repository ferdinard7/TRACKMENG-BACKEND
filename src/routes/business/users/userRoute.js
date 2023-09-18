const express = require("express");
const validateToken = require("../../../middleware/validateTokenHandler");
const { registerUser, loginUserEmail, sendOTPPhoneNumber,sendOTPverificationEmail, getCurrentUser, loginUserNumber, registerAgent } = require("../../../controllers/business/users/auth");
const { getAllUsers } = require("../../../controllers/business/users/userController");
const router = express.Router();

// GET ALL USERS
router.get("/", getAllUsers);

// REGISTER USER
router.post("/register", registerUser);

// SEND OTP TO USER NUMBER
router.get("/send-otp/:phoneNumber", sendOTPPhoneNumber);

// SEND OTP TO USER EMAIL
router.get("/send-otp-email/:email", sendOTPverificationEmail);

// LOGIN USER WITH EMAIL
router.post("/login-email", loginUserEmail);

// LOGIN USER WITH PHONE NUMBER
router.post("/login-number", loginUserNumber);

// GET CURRENT LOGGED-IN USER
router.get("/current", validateToken, getCurrentUser);
// router.post("/verifyemail", verifyEmailOtp);

router.post("/register-agent", validateToken, registerAgent);
// router.post("/verifynumber", verifyNumberOtp);






module.exports = router; 