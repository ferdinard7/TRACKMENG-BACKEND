const express = require("express");
const validateToken = require("../../../middleware/validateTokenHandler");
const { getCurrentUser } = require("../../../controllers/business/users/auth");
const { getAllAgents } = require("../../../controllers/business/users/adminController");
const { loginAgentEmail, loginAgentNumber, getAgentInfo, updateAgentInfo, updateAgentPassword } = require("../../../controllers/business/users/agentController");
const { Payment, Success } = require("../../../controllers/business/users/subscription");
const router = express.Router();

// GET ALL AGENTS
router.get("/agents", getAllAgents);

// LOGIN AGENT WITH EMAIL
router.post("/login-agent-email", loginAgentEmail);

// LOGIN AGENT WITH PHONE NUMBER
router.post("/login-agent-number", loginAgentNumber);

// GET CURRENT LOGGED-IN USER
router.get("/current", validateToken, getCurrentUser);

// GET ADMIN INFO
router.get("/agent-info", validateToken, getAgentInfo);

// UPDATE AGENT INFO
router.put("/update-agent", validateToken, updateAgentInfo);

// router.post("/register-agent", validateToken, registerAgent);
router.post("/create-subscription", Payment);

// UPDATE ADMIN PASSWORD
router.put("/update-password", validateToken, updateAgentPassword);

router.get("/success", Success);

module.exports = router;