const User = require("../../models/User");
const Order = require("../../models/Order");
const { buildBusinessSnapshot, verifyJobformRequest } = require("../../helpers/jobform-integration");

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

module.exports = { exportBusinessContext };
