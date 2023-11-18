const express = require("express");
const { AdminforgotPassword, updateAdminPassword, changeAdminPassword } = require("../../../controllers/password/resetAdminPassword");
const { AgentforgotPassword, updateAgentPassword } = require("../../../controllers/password/resetAgentPassword");
const validateToken = require("../../../middleware/validateTokenHandler");
const router = express.Router();

// SEND A LINK TO THE ADMIN EMAIL WITH A TOKEN
router.post("/admin-forgot-password", AdminforgotPassword);

// UPDATE ADMIN PASSWORD IN THE DB
router.post("/reset-admin-password", updateAdminPassword);

// SEND A LINK TO THE AGENT EMAIL WITH A TOKEN
router.post("/agent-forgot-password", AgentforgotPassword);

// UPDATE ADMIN PASSWORD IN THE DB
router.post("/reset-agent-password", updateAgentPassword);

// CHANGE ADMIN PASSWORD
router.put("/update-password", validateToken, changeAdminPassword);

module.exports = router;