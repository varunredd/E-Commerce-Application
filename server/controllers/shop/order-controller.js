const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId,
      payerId,
      cartId,
    } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const productIds = cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const enrichedCartItems = cartItems.map((item) => {
      const matchedProduct = productMap.get(String(item.productId));

      if (!matchedProduct) {
        throw new Error(`Product not found for item: ${item.title}`);
      }

      return {
        ...item,
        ownerAdminId: matchedProduct.ownerAdminId || undefined,
      };
    });

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
            total: Number(totalAmount).toFixed(2),
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
        orderStatus,
        paymentMethod,
        paymentStatus,
        totalAmount,
        orderDate,
        orderUpdateDate,
        paymentId,
        payerId,
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
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

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
    await order.save();

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