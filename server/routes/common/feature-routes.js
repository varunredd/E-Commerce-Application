const express = require("express");

const {
  addFeatureImage,
  getFeatureImages,
  deleteFeatureImage,
} = require("../../controllers/common/feature-controller");

const { authMiddleware, requireRole } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.get("/get", getFeatureImages);
router.post("/add", authMiddleware, requireRole("super_admin"), addFeatureImage);
router.delete("/delete/:id", authMiddleware, requireRole("super_admin"), deleteFeatureImage);

module.exports = router;