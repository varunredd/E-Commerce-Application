const Product = require("../../models/Product");

const getFilteredProducts = async (req, res) => {
  try {
    const {
      category = [],
      brand = [],
      sortBy = "price-lowtohigh",
      page = 1,
      limit = 12,
    } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (brand.length) {
      filters.brand = { $in: brand.split(",") };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      default:
        sort.price = 1;
        break;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(filters).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(filters),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalProducts: totalCount,
        hasMore: skip + products.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Filter products error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Product details error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
    });
  }
};

module.exports = { getFilteredProducts, getProductDetails };
