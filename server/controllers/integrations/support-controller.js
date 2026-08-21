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
      const missing = [];
      if (!(process.env.JOBFORM_BASE_URL || "").trim()) missing.push("JOBFORM_BASE_URL");
      if ((process.env.BUSINESS_INTEGRATION_SECRET || "").trim().length < 32) {
        missing.push("BUSINESS_INTEGRATION_SECRET");
      }
      console.error("[Jobform] Support launch unavailable. Missing/invalid:", missing.join(", "));
      return res.status(503).json({
        success: false,
        message:
          "Customer support is not configured on the server. Set JOBFORM_BASE_URL and BUSINESS_INTEGRATION_SECRET in Railway.",
        missing,
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
      Order.findOne({ _id: orderId, userId: String(userId) }),
    ]);

    if (!user || !order) {
      return res.status(404).json({
        success: false,
        message: "User or order not found",
      });
    }

    const allOrders = await Order.find({ userId: String(userId) })
      .sort({ orderDate: -1 })
      .limit(20);

    await syncBusinessContext(user, allOrders);

    const launch = await launchSupport(userId, orderId);
    if (!launch?.launchUrl) {
      return res.status(502).json({
        success: false,
        message: "Support service did not return a launch URL",
      });
    }

    res.status(200).json({
      success: true,
      data: launch,
    });
  } catch (error) {
    console.error("Support launch error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to launch support session",
    });
  }
};

module.exports = { launchSupportSession };
