const express = require("express");
const {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
} = require("../../controllers/admin/order-controller");
const { authMiddleware, requireRole } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// All admin order routes require auth + admin role
router.use(authMiddleware, requireRole("admin"));

router.get("/get", getAllOrdersOfAllUsers);
router.get("/details/:id", getOrderDetailsForAdmin);
router.put("/update/:id", updateOrderStatus);

module.exports = router;
