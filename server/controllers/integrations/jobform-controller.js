const User = require("../../models/User");
const Order = require("../../models/Order");
const { buildBusinessSnapshot, verifyJobformRequest } = require("../../helpers/jobform-integration");
const {
  resolveItemFromOrder,
  initializeReturnPickup,
} = require("../../helpers/return-logistics");
const { sendRefundInitiatedEmail } = require("../../helpers/email");

const exportBusinessContext = async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body ?? {});
    verifyJobformRequest(req, rawBody);

    const customerId = req.body?.customerId;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }

    const [customer, orders] = await Promise.all([
      User.findById(customerId),
      Order.find({ userId: customerId }).sort({ orderDate: -1 }).limit(20),
    ]);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const snapshot = await buildBusinessSnapshot(customer, orders);
    return res.status(200).json(snapshot);
  } catch (error) {
    console.error("Jobform export error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Unable to export business context",
    });
  }
};

const exportAllBusinessContexts = async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body ?? {});
    verifyJobformRequest(req, rawBody);

    const limit = Math.min(Math.max(Number(req.body?.limit) || 500, 1), 500);
    const users = await User.find({ role: "user" }).limit(limit);
    const snapshots = [];

    for (const customer of users) {
      const orders = await Order.find({ userId: String(customer._id) })
        .sort({ orderDate: -1 })
        .limit(20);
      if (!orders.length) continue;
      snapshots.push(await buildBusinessSnapshot(customer, orders));
    }

    return res.status(200).json({ snapshots });
  } catch (error) {
    console.error("Jobform export-all error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Unable to export business contexts",
    });
  }
};

const applyRefundCompleted = async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body ?? {});
    verifyJobformRequest(req, rawBody);

    const {
      refundId,
      orderId,
      itemId,
      quantity,
      amountCents,
      reason,
      condition,
      returnStatus,
    } = req.body ?? {};

    if (!refundId || !orderId || !itemId || !Number.isInteger(quantity) || !Number.isInteger(amountCents)) {
      return res.status(400).json({
        success: false,
        message: "refundId, orderId, itemId, quantity, and amountCents are required",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const existingRefund = order.refundRecords?.find(
      (record) => record.refundId === String(refundId),
    );
    if (existingRefund) {
      return res.status(200).json({
        success: true,
        idempotentReplay: true,
        orderId: String(order._id),
        refundedAmount: order.refundedAmount,
        returnStatus: order.returnStatus,
        returnShipping: order.returnShipping,
        returnTrackingNumber: order.returnShipping?.trackingNumber || "",
      });
    }

    const refundAmount = amountCents / 100;
    const itemMeta = resolveItemFromOrder(order, itemId);
    const refundRecord = {
      refundId: String(refundId),
      itemId: String(itemId),
      quantity,
      amount: refundAmount,
      reason: reason || "",
      condition: condition || "",
      processedAt: new Date(),
      itemTitle: itemMeta.title,
      itemSku: itemMeta.sku,
    };

    order.refundedAmount =
      Math.round(((order.refundedAmount || 0) + refundAmount) * 100) / 100;
    order.returnStatus = returnStatus || "REFUND_APPROVED";

    if (!Array.isArray(order.refundRecords)) {
      order.refundRecords = [];
    }
    order.refundRecords.push(refundRecord);

    const returnShipping = initializeReturnPickup(order, refundId);
    order.orderUpdateDate = new Date();
    await order.save();

    User.findById(order.userId)
      .then((user) => {
        if (!user) return;
        return sendRefundInitiatedEmail(
          user.email,
          user.userName,
          order,
          refundRecord,
          returnShipping,
        );
      })
      .catch((err) => console.error("Refund initiated email failed:", err.message));

    return res.status(200).json({
      success: true,
      orderId: String(order._id),
      refundedAmount: order.refundedAmount,
      returnStatus: order.returnStatus,
      returnShipping: order.returnShipping,
      returnTrackingNumber: returnShipping.trackingNumber,
      refundRecord,
    });
  } catch (error) {
    console.error("Jobform refund-completed error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Unable to apply refund",
    });
  }
};

module.exports = { exportBusinessContext, exportAllBusinessContexts, applyRefundCompleted };
