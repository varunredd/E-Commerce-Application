const express = require("express");
const { launchSupportSession } = require("../../controllers/integrations/support-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware);
router.post("/launch", launchSupportSession);

module.exports = router;
