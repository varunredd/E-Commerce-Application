const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    category: String,
    brand: String,
    price: Number,
    salePrice: Number,
    totalStock: Number,
    averageReview: Number,
  },
  { timestamps: true }
);

// Indexes for filter + sort queries
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ brand: 1, price: 1 });
ProductSchema.index({ category: 1, brand: 1, price: 1 });
ProductSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", ProductSchema);
