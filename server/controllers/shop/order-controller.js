const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const User = require("../../models/User");
const { sendOrderConfirmationEmail } = require("../../helpers/email");
const { syncBusinessContext, isConfigured: isJobformConfigured } = require("../../helpers/jobform-integration");
const { generateDemoShipment, progressShippingTimeline } = require("../../helpers/shipping");
const { sendShippingEmail } = require("../../helpers/email");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cartItems,
      addressInfo,
      paymentMethod,
      cartId,
    } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Fetch real product data from DB to prevent price manipulation
    const productIds = cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products not found",
      });
    }

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    // Validate stock and build enriched items with DB prices
    const enrichedCartItems = [];
    let serverTotalAmount = 0;

    for (const item of cartItems) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Available: ${product.totalStock}`,
        });
      }

      const unitPrice = product.salePrice > 0 ? product.salePrice : product.price;

      enrichedCartItems.push({
        productId: String(product._id),
        title: product.title,
        image: product.image,
        price: unitPrice,
        quantity: item.quantity,
        ownerAdminId: product.ownerAdminId || undefined,
      });

      serverTotalAmount += unitPrice * item.quantity;
    }

    serverTotalAmount = Math.round(serverTotalAmount * 100) / 100;

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${clientUrl}/shop/paypal-return`,
        cancel_url: `${clientUrl}/shop/paypal-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: enrichedCartItems.map((item) => ({
              name: item.title,
              sku: item.productId,
              price: Number(item.price).toFixed(2),
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: Number(serverTotalAmount).toFixed(2),
          },
          description: "E-Commerce Order",
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.error("PayPal create error:", error);
        return res.status(500).json({
          success: false,
          message: "Error while creating PayPal payment",
        });
      }

      const newlyCreatedOrder = new Order({
        userId,
        cartId,
        cartItems: enrichedCartItems,
        addressInfo,
        orderStatus: "pending",
        paymentMethod: paymentMethod || "paypal",
        paymentStatus: "pending",
        totalAmount: serverTotalAmount,
        orderDate: new Date(),
        orderUpdateDate: new Date(),
      });

      await newlyCreatedOrder.save();

      const approvalURL = paymentInfo.links.find(
        (link) => link.rel === "approval_url"
      )?.href;

      res.status(201).json({
        success: true,
        approvalURL,
        orderId: newlyCreatedOrder._id,
      });
    });
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    // Demo mode: skip paypal.payment.execute() since we're using sandbox
    // In production with real payments, you'd call:
    // paypal.payment.execute(paymentId, { payer_id: payerId }, callback)

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;
    order.orderUpdateDate = new Date();

    for (let item of order.cartItems) {
      const result = await Product.findOneAndUpdate(
        { _id: item.productId, totalStock: { $gte: item.quantity } },
        { $inc: { totalStock: -item.quantity } },
        { new: true }
      );

      if (!result) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${item.title}`,
        });
      }
    }

    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId);

    // Generate demo shipment
    order.shipping = generateDemoShipment(order);
    await order.save();

    // Post-capture tasks (fire-and-forget)
    User.findById(userId)
      .then(async (u) => {
        if (!u) return;
        sendOrderConfirmationEmail(u.email, u.userName, order).catch((err) =>
          console.error("Order email failed:", err.message)
        );
        sendShippingEmail(u.email, u.userName, order).catch((err) =>
          console.error("Shipping email failed:", err.message)
        );
        if (isJobformConfigured()) {
          const allOrders = await Order.find({ userId }).sort({ orderDate: -1 }).limit(20);
          syncBusinessContext(u, allOrders).catch((err) =>
            console.error("Jobform sync failed:", err.message)
          );
        }
      })
      .catch((err) => console.error("Post-capture tasks failed:", err.message));

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (error) {
    console.error("Capture payment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to capture payment",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId }).sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Progress demo shipping timeline based on elapsed time
    if (progressShippingTimeline(order)) {
      await order.save();
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Order details error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
