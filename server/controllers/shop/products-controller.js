const Product = require("../../models/Product");
const User = require("../../models/User");

const enrichProductsWithOwner = async (products) => {
  const ownerIds = [
    ...new Set(
      products
        .map((product) => product.ownerAdminId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  if (!ownerIds.length) {
    return products.map((product) => ({
      ...product.toObject(),
      ownerAdminName: null,
      ownerAdminEmail: null,
    }));
  }

  const owners = await User.find(
    { _id: { $in: ownerIds } },
    { userName: 1, email: 1 }
  );

  const ownerMap = new Map(
    owners.map((owner) => [
      String(owner._id),
      {
        ownerAdminName: owner.userName,
        ownerAdminEmail: owner.email,
      },
    ])
  );

  return products.map((product) => {
    const ownerInfo = product.ownerAdminId
      ? ownerMap.get(String(product.ownerAdminId))
      : null;

    return {
      ...product.toObject(),
      ownerAdminName: ownerInfo?.ownerAdminName || null,
      ownerAdminEmail: ownerInfo?.ownerAdminEmail || null,
    };
  });
};

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

    const enrichedProducts = await enrichProductsWithOwner(products);

    res.status(200).json({
      success: true,
      data: enrichedProducts,
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

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    let ownerAdminName = null;
    let ownerAdminEmail = null;

    if (product.ownerAdminId) {
      const owner = await User.findById(product.ownerAdminId, {
        userName: 1,
        email: 1,
      });

      if (owner) {
        ownerAdminName = owner.userName;
        ownerAdminEmail = owner.email;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        ownerAdminName,
        ownerAdminEmail,
      },
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