const Product = require("../../models/Product");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Keyword is required and must be in string format",
      });
    }

    const sanitized = escapeRegex(keyword.trim());
    const regEx = new RegExp(sanitized, "i");

    const searchResults = await Product.find({
      $or: [
        { title: regEx },
        { description: regEx },
        { category: regEx },
        { brand: regEx },
      ],
    }).limit(20);

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

module.exports = { searchProducts };
