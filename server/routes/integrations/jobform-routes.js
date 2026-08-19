const express = require("express");
const {
  exportBusinessContext,
  exportAllBusinessContexts,
  applyRefundCompleted,
} = require("../../controllers/integrations/jobform-controller");

const router = express.Router();

router.post("/export", exportBusinessContext);
router.post("/export-all", exportAllBusinessContexts);
router.post("/refund-completed", applyRefundCompleted);

module.exports = router;
