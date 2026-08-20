const mongoose = require("mongoose");

const ShippingEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: "" },
    timestamp: { type: Date, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

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
        ownerAdminId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: false,
          index: true,
        },
        finalSale: {
          type: Boolean,
          default: false,
        },
        refundable: {
          type: Boolean,
          default: true,
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
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnStatus: {
      type: String,
      default: "",
    },
    returnShipping: {
      carrier: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      pickupScheduledAt: { type: Date },
      pickupWindowStart: { type: Date },
      pickupWindowEnd: { type: Date },
      agentName: { type: String, default: "" },
      agentPhone: { type: String, default: "" },
      estimatedRefundAt: { type: Date },
      events: [ShippingEventSchema],
    },
    refundRecords: [
      {
        refundId: { type: String, required: true },
        itemId: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        amount: { type: Number, default: 0 },
        reason: { type: String, default: "" },
        condition: { type: String, default: "" },
        processedAt: { type: Date, default: Date.now },
        itemTitle: { type: String, default: "" },
        itemSku: { type: String, default: "" },
      },
    ],
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
    shipping: {
      carrier: { type: String, default: "" },
      trackingNumber: { type: String, default: "" },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      events: [ShippingEventSchema],
    },
  },
  { timestamps: true }
);

OrderSchema.index({ "cartItems.ownerAdminId": 1, orderDate: -1 });
OrderSchema.index({ userId: 1, orderDate: -1 });

module.exports = mongoose.model("Order", OrderSchema);
