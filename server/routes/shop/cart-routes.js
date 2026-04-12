const express = require("express");
const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartItemQty,
} = require("../../controllers/shop/cart-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/add", addToCart);
router.get("/get/:userId", fetchCartItems);
router.put("/update-cart", updateCartItemQty);
router.delete("/:userId/:productId", deleteCartItem);

module.exports = router;
