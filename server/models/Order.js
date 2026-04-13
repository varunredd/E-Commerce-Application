const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    cartId: {
      type: String,
      default: "",
    },
    cartItems: [
      {
        productId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          default: "",
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // product ownership for multi-admin order visibility
        ownerAdminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
          index: true,
        },
      },
    ],
    addressInfo: {
      addressId: String,
      address: String,
      city: String,
      pincode: String,
      phone: String,
      notes: String,
    },
    orderStatus: {
      type: String,
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderUpdateDate: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: String,
      default: "",
    },
    payerId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

OrderSchema.index({ "cartItems.ownerAdminId": 1, orderDate: -1 });
OrderSchema.index({ userId: 1, orderDate: -1 });

module.exports = mongoose.model("Order", OrderSchema);