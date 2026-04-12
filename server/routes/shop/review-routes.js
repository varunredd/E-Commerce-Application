const express = require("express");
const {
  addProductReview,
  getProductReviews,
} = require("../../controllers/shop/product-review-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/add", authMiddleware, addProductReview);
router.get("/:productId", getProductReviews); // public — anyone can read reviews

module.exports = router;
