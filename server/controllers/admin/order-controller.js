const Order = require("../../models/Order");

const getAdminUserId = (req) => req.user?.id || req.user?._id;

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const adminUserId = getAdminUserId(req);
    const role = req.user?.role;

    const filter =
      role === "super_admin"
        ? {}
        : { "cartItems.ownerAdminId": adminUserId };

    const orders = await Order.find(filter).sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    const normalizedOrders =
      role === "super_admin"
        ? orders
        : orders.map((order) => {
            const ownedItems = order.cartItems.filter(
              (item) =>
                item.ownerAdminId &&
                String(item.ownerAdminId) === String(adminUserId)
            );

            const ownedTotalAmount = ownedItems.reduce((sum, item) => {
              const price = Number(item.price) || 0;
              const quantity = Number(item.quantity) || 0;
              return sum + price * quantity;
            }, 0);

            return {
              ...order.toObject(),
              cartItems: ownedItems,
              adminVisibleItemCount: ownedItems.length,
              adminVisibleTotalAmount: ownedTotalAmount,
            };
          });

    res.status(200).json({
      success: true,
      data: normalizedOrders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = getAdminUserId(req);
    const role = req.user?.role;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    if (role !== "super_admin") {
      const ownedItems = order.cartItems.filter(
        (item) =>
          item.ownerAdminId &&
          String(item.ownerAdminId) === String(adminUserId)
      );

      if (!ownedItems.length) {
        return res.status(404).json({
          success: false,
          message: "Order not found!",
        });
      }

      const ownedTotalAmount = ownedItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + price * quantity;
      }, 0);

      return res.status(200).json({
        success: true,
        data: {
          ...order.toObject(),
          cartItems: ownedItems,
          adminVisibleItemCount: ownedItems.length,
          adminVisibleTotalAmount: ownedTotalAmount,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const adminUserId = getAdminUserId(req);
    const role = req.user?.role;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    if (role !== "super_admin") {
      const hasOwnedItem = order.cartItems.some(
        (item) =>
          item.ownerAdminId &&
          String(item.ownerAdminId) === String(adminUserId)
      );

      if (!hasOwnedItem) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this order!",
        });
      }
    }

    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status is updated successfully!",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
};