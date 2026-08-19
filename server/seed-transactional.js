/**
 * Seed transactional data for existing users + products.
 * Does NOT delete or recreate users/products.
 *
 * Creates per customer (role=user):
 *   - 1-2 delivery addresses
 *   - 2-4 orders in mixed statuses (delivered, inShipping, confirmed)
 *   - shipping/tracking on fulfilled orders
 *   - optional reviews on delivered orders
 *   - optional Jobform business context sync
 *
 * Usage:
 *   node seed-transactional.js
 *   node seed-transactional.js --sync-jobform
 *   node seed-transactional.js --sync-only          # push existing orders to Jobform (no new data)
 *   node seed-transactional.js --email=user@example.com
 *   node seed-transactional.js --clear-first
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Address = require("./models/Address");
const Review = require("./models/Review");
const { generateDemoShipment } = require("./helpers/shipping");
const { syncBusinessContext, isConfigured } = require("./helpers/jobform-integration");

const args = process.argv.slice(2);
const syncJobform = args.includes("--sync-jobform");
const syncOnly = args.includes("--sync-only");
const clearFirst = args.includes("--clear-first");
const emailArg = args.find((a) => a.startsWith("--email="));
const targetEmail = emailArg ? emailArg.split("=")[1].toLowerCase().trim() : null;

const SAMPLE_ADDRESSES = [
  {
    address: "742 Evergreen Terrace",
    city: "Springfield",
    pincode: "62704",
    phone: "+1-555-0101",
    notes: "Leave at front door",
  },
  {
    address: "221B Baker Street",
    city: "London",
    pincode: "NW1 6XE",
    phone: "+44-20-7946-0958",
    notes: "Ring doorbell twice",
  },
  {
    address: "350 Fifth Avenue, Apt 12B",
    city: "New York",
    pincode: "10118",
    phone: "+1-555-0199",
    notes: "Doorman available 9am-6pm",
  },
];

const ORDER_STATUS_PLANS = [
  { orderStatus: "delivered", paymentStatus: "paid", daysAgo: 45 },
  { orderStatus: "delivered", paymentStatus: "paid", daysAgo: 20 },
  { orderStatus: "inShipping", paymentStatus: "paid", daysAgo: 5 },
  { orderStatus: "confirmed", paymentStatus: "paid", daysAgo: 2 },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickProducts(products, count) {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function unitPrice(product) {
  return product.salePrice > 0 ? product.salePrice : product.price;
}

function buildCartItems(products) {
  return products.map((product) => {
    const quantity = 1 + Math.floor(Math.random() * 2);
    return {
      productId: String(product._id),
      title: product.title,
      image: product.image,
      price: unitPrice(product),
      quantity,
      ownerAdminId: product.ownerAdminId || undefined,
    };
  });
}

function totalAmount(cartItems) {
  return Math.round(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
}

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function buildShippingForStatus(order, orderStatus, orderDate) {
  if (!["inShipping", "delivered"].includes(orderStatus)) {
    return undefined;
  }

  const shipping = generateDemoShipment(order);
  shipping.shippedAt = new Date(orderDate);
  shipping.shippedAt.setDate(shipping.shippedAt.getDate() + 1);

  if (orderStatus === "delivered") {
    const deliveredAt = new Date(shipping.shippedAt);
    deliveredAt.setDate(deliveredAt.getDate() + 3);
    shipping.deliveredAt = deliveredAt;
    shipping.events.push(
      {
        status: "picked_up",
        location: "Memphis, TN",
        timestamp: new Date(shipping.shippedAt.getTime() + 2 * 60 * 60 * 1000),
        description: `Package picked up by ${shipping.carrier}`,
      },
      {
        status: "in_transit",
        location: "Chicago, IL",
        timestamp: new Date(shipping.shippedAt.getTime() + 24 * 60 * 60 * 1000),
        description: "Package in transit to destination",
      },
      {
        status: "delivered",
        location: order.addressInfo?.city || "Destination",
        timestamp: deliveredAt,
        description: "Package delivered — left at front door",
      }
    );
  } else {
    shipping.events.push({
      status: "in_transit",
      location: "Chicago, IL",
      timestamp: new Date(shipping.shippedAt.getTime() + 12 * 60 * 60 * 1000),
      description: "Package in transit to destination",
    });
  }

  return shipping;
}

async function seedTransactional() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  if (clearFirst) {
    const [orders, addresses, reviews] = await Promise.all([
      Order.deleteMany({}),
      Address.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log(
      `Cleared transactional data: ${orders.deletedCount} orders, ${addresses.deletedCount} addresses, ${reviews.deletedCount} reviews\n`
    );
  }

  const userFilter = { role: "user" };
  if (targetEmail) userFilter.email = targetEmail;

  const users = await User.find(userFilter);
  const products = await Product.find({});

  if (!users.length) {
    console.error(
      targetEmail
        ? `No user found with email: ${targetEmail}`
        : "No users with role 'user' found. Create users first, then rerun."
    );
    process.exit(1);
  }

  if (!products.length) {
    console.error("No products found. Run `node seed.js` first to seed products.");
    process.exit(1);
  }

  let totalAddresses = 0;
  let totalOrders = 0;
  let totalReviews = 0;

  for (const user of users) {
    if (syncOnly) {
      const existingOrders = await Order.find({ userId: String(user._id) }).sort({
        orderDate: -1,
      });
      console.log(`✓ ${user.email} → ${existingOrders.length} existing order(s)`);

      if ((syncJobform || syncOnly) && isConfigured() && existingOrders.length) {
        try {
          const result = await syncBusinessContext(user, existingOrders);
          console.log(
            `  ↳ Jobform sync: ${result?.idempotentReplay ? "replayed" : "synced"} (${existingOrders.length} orders)`
          );
        } catch (err) {
          console.error(`  ↳ Jobform sync failed: ${err.message}`);
        }
      }
      continue;
    }

    // Mark verified for demo/testing login + Jobform sync
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    const addressCount = 1 + Math.floor(Math.random() * 2);
    const addresses = [];

    for (let i = 0; i < addressCount; i++) {
      const template = SAMPLE_ADDRESSES[i % SAMPLE_ADDRESSES.length];
      const address = await Address.create({
        userId: String(user._id),
        ...template,
      });
      addresses.push(address);
      totalAddresses++;
    }

    const planCount = 2 + Math.floor(Math.random() * 2);
    const statusPlan = ORDER_STATUS_PLANS.slice(0, planCount);
    const createdOrders = [];

    for (const plan of statusPlan) {
      const orderProducts = pickProducts(products, 1 + Math.floor(Math.random() * 3));
      const cartItems = buildCartItems(orderProducts);
      const address = pickRandom(addresses);
      const orderDate = daysAgoDate(plan.daysAgo);
      const orderUpdateDate = new Date(orderDate);
      orderUpdateDate.setDate(orderUpdateDate.getDate() + 2);

      const orderPayload = {
        userId: String(user._id),
        cartId: "",
        cartItems,
        addressInfo: {
          addressId: String(address._id),
          address: address.address,
          city: address.city,
          pincode: address.pincode,
          phone: address.phone,
          notes: address.notes,
        },
        orderStatus: plan.orderStatus,
        paymentMethod: "paypal",
        paymentStatus: plan.paymentStatus,
        totalAmount: totalAmount(cartItems),
        orderDate,
        orderUpdateDate,
        paymentId: `PAY-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
        payerId: `PAYER-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      };

      const shipping = buildShippingForStatus(
        orderPayload,
        plan.orderStatus,
        orderDate
      );
      if (shipping) orderPayload.shipping = shipping;

      const order = await Order.create(orderPayload);
      createdOrders.push(order);
      totalOrders++;

      if (plan.orderStatus === "delivered" && orderProducts.length) {
        const product = orderProducts[0];
        const existingReview = await Review.findOne({
          productId: String(product._id),
          userId: String(user._id),
        });

        if (!existingReview) {
          await Review.create({
            productId: String(product._id),
            userId: String(user._id),
            userName: user.userName,
            reviewMessage: "Great quality and fast delivery. Would buy again.",
            reviewValue: 4 + Math.floor(Math.random() * 2),
          });
          totalReviews++;
        }
      }
    }

    console.log(
      `✓ ${user.email} → ${addresses.length} address(es), ${createdOrders.length} order(s)`
    );

    if (syncJobform && isConfigured()) {
      try {
        const result = await syncBusinessContext(user, createdOrders);
        console.log(
          `  ↳ Jobform sync: ${result?.idempotentReplay ? "replayed" : "synced"} (${createdOrders.length} orders)`
        );
      } catch (err) {
        console.error(`  ↳ Jobform sync failed: ${err.message}`);
      }
    }
  }

  if (syncOnly) {
    console.log("\n── Sync-only mode (no new data created) ──");
  } else {
    console.log("\n── Summary ──");
    console.log(`Users processed:  ${users.length}`);
    console.log(`Addresses added:  ${totalAddresses}`);
    console.log(`Orders added:     ${totalOrders}`);
    console.log(`Reviews added:    ${totalReviews}`);
  }

  if ((syncJobform || syncOnly) && !isConfigured()) {
    console.log(
      "\nJobform sync skipped (set JOBFORM_BASE_URL + BUSINESS_INTEGRATION_SECRET in .env)"
    );
  }

  await mongoose.disconnect();
  console.log("\nDone! Transactional seed complete.");
}

seedTransactional().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
