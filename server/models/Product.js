const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    averageReview: {
      type: Number,
      default: 0,
      min: 0,
    },

    // multi-admin ownership
    ownerAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for filter + sort queries
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ brand: 1, price: 1 });
ProductSchema.index({ category: 1, brand: 1, price: 1 });
ProductSchema.index({ ownerAdminId: 1, createdAt: -1 });
ProductSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", ProductSchema);