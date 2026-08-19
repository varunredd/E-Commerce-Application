const express = require("express");
const { exportBusinessContext } = require("../../controllers/integrations/jobform-controller");

const router = express.Router();

router.post("/export", exportBusinessContext);

module.exports = router;
