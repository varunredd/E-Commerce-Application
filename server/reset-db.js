/**
 * Reset transactional data — clears orders, carts, addresses, reviews.
 * Keeps users and products intact.
 *
 * Usage:  node reset-db.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./models/Order");
const Cart = require("./models/Cart");
const Address = require("./models/Address");
const Review = require("./models/Review");

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const results = await Promise.all([
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Address.deleteMany({}),
      Review.deleteMany({}),
    ]);

    console.log(`Deleted ${results[0].deletedCount} orders`);
    console.log(`Deleted ${results[1].deletedCount} carts`);
    console.log(`Deleted ${results[2].deletedCount} addresses`);
    console.log(`Deleted ${results[3].deletedCount} reviews`);

    await mongoose.disconnect();
    console.log("\nDone! Transactional data cleared. Users and products are untouched.");
  } catch (error) {
    console.error("Reset failed:", error.message);
    process.exit(1);
  }
}

reset();
