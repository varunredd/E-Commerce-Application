const express = require("express");
const {
  handleImageUpload,
  addProduct,
  editProduct,
  fetchAllProducts,
  deleteProduct,
} = require("../../controllers/admin/products-controller");
const { upload } = require("../../helpers/cloudinary");
const { authMiddleware, requireRole } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// All admin product routes require auth + admin role
router.use(authMiddleware, requireRole("admin"));

router.post("/upload-image", upload.single("my_file"), handleImageUpload);
router.post("/add", addProduct);
router.put("/edit/:id", editProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/get", fetchAllProducts);

module.exports = router;
