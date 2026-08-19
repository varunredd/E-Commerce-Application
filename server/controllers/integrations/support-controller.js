const User = require("../../models/User");
const Order = require("../../models/Order");
const { syncBusinessContext, launchSupport, isConfigured } = require("../../helpers/jobform-integration");

/**
 * POST /api/integrations/support/launch
 * Body: { orderId }
 * 
 * Syncs the customer's context to Jobform, then returns a support launch URL
 * scoped to a specific order. The e-commerce user clicks "Get Help" on an order
 * and gets redirected to the Jobform support agent with full context.
 */
const launchSupportSession = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Customer support is not available at this time",
      });
    }

    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const [user, order] = await Promise.all([
      User.findById(userId),
      Order.findOne({ _id: orderId, userId }),
    ]);

    if (!user || !order) {
      return res.status(404).json({
        success: false,
        message: "User or order not found",
      });
    }

    // Get all user's orders to sync full context
    const allOrders = await Order.find({ userId }).sort({ orderDate: -1 }).limit(20);

    // Sync business context (fire-and-forget-safe, but we await for the launch to work)
    await syncBusinessContext(user, allOrders);

    // Launch support session for this specific order
    const launch = await launchSupport(userId, orderId);

    res.status(200).json({
      success: true,
      data: launch,
    });
  } catch (error) {
    console.error("Support launch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to launch support session",
    });
  }
};

module.exports = { launchSupportSession };
