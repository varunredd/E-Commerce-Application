const { imageUploadUtil } = require("../../helpers/cloudinary");
const Product = require("../../models/Product");

const getOwnerFilter = (req) => {
  const userId = req.user?.id || req.user?._id;
  const role = req.user?.role;

  // super admin can access everything
  if (role === "super_admin") {
    return {};
  }

  // normal admin only sees own products
  if (userId) {
    return { ownerAdminId: userId };
  }

  // fallback: no user context, return nothing (safe default)
  return { ownerAdminId: null };
};

const handleImageUpload = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await imageUploadUtil(url);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Image upload error:", error.message);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
    } = req.body;

    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User context required to create a product",
      });
    }

    const newlyCreatedProduct = new Product({
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview: 0,
      ownerAdminId: userId,
    });

    await newlyCreatedProduct.save();

    res.status(201).json({
      success: true,
      data: newlyCreatedProduct,
    });
  } catch (error) {
    console.error("Add product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
    });
  }
};

const fetchAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const filter = getOwnerFilter(req);

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error("Fetch products error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
    } = req.body;

    const filter = {
      _id: id,
      ...getOwnerFilter(req),
    };

    let findProduct = await Product.findOne(filter);

    if (!findProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not accessible",
      });
    }

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.brand = brand || findProduct.brand;
    findProduct.price = price === "" ? 0 : price || findProduct.price;
    findProduct.salePrice =
      salePrice === "" ? 0 : salePrice || findProduct.salePrice;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;

    await findProduct.save();

    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (error) {
    console.error("Edit product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to edit product",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = {
      _id: id,
      ...getOwnerFilter(req),
    };

    const product = await Product.findOneAndDelete(filter);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not accessible",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
};