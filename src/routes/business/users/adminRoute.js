const express = require("express");
const validateToken = require("../../../middleware/validateTokenHandler");
const { registerAdmin, getCurrentUser, registerAgent, loginAdminEmail, loginAdminNumber, getAdminInfo, updateAdminInfo } = require("../../../controllers/business/users/auth");
const { getAllAdmins } = require("../../../controllers/business/users/adminController");
const { sendOTPPhoneNumber, sendOTPverificationEmail } = require("../../../controllers/business/users/otpController");
const router = express.Router();

// GET ALL ADMINS
router.get("/admins", getAllAdmins);

// REGISTER ADMIN
router.post("/register-admin", registerAdmin);

// SEND OTP TO USER NUMBER
router.get("/send-otp/:phoneNumber", sendOTPPhoneNumber);

// SEND OTP TO USER EMAIL
router.get("/send-otp-email/:email", sendOTPverificationEmail);

// LOGIN ADMIN WITH EMAIL
router.post("/login-admin-email", loginAdminEmail);

// LOGIN ADMIN WITH PHONE NUMBER
router.post("/login-admin-number", loginAdminNumber);

// GET CURRENT LOGGED-IN USER
router.get("/current", validateToken, getCurrentUser);

// GET ADMIN INFO
router.get("/admin-info", validateToken, getAdminInfo);

// UPDATE ADMIN INFO
router.put("/update-admin", validateToken, updateAdminInfo);

router.post("/register-agent", validateToken, registerAgent);



module.exports = router; 