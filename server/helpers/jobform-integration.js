const crypto = require("crypto");
const Product = require("../models/Product");

const JOBFORM_BASE_URL = process.env.JOBFORM_BASE_URL || "";
const BUSINESS_INTEGRATION_SECRET = process.env.BUSINESS_INTEGRATION_SECRET || "";

function isConfigured() {
  return JOBFORM_BASE_URL.length > 0 && BUSINESS_INTEGRATION_SECRET.length >= 32;
}

function signPayload({ timestamp, eventId, rawBody }) {
  return crypto
    .createHmac("sha256", BUSINESS_INTEGRATION_SECRET)
    .update(`${timestamp}.${eventId}.${rawBody}`)
    .digest("hex");
}

function buildHeaders(rawBody) {
  const timestamp = String(Date.now());
  const eventId = `ecom_${crypto.randomUUID()}`;
  const signature = signPayload({ timestamp, eventId, rawBody });
  return {
    "Content-Type": "application/json",
    "x-jobform-timestamp": timestamp,
    "x-jobform-event-id": eventId,
    "x-jobform-signature": `sha256=${signature}`,
    "x-jobform-source": "ecommerce-platform",
  };
}

function verifyJobformRequest(req, rawBody) {
  const secret = BUSINESS_INTEGRATION_SECRET.trim();
  if (!secret || secret.length < 32) {
    throw new Error("Business integration secret is not configured securely.");
  }

  const timestamp = req.headers["x-jobform-timestamp"];
  const eventId = req.headers["x-jobform-event-id"];
  const signature = req.headers["x-jobform-signature"];
  if (!timestamp || !eventId || !signature) {
    throw new Error("Signed integration headers are required.");
  }

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) {
    throw new Error("Integration request timestamp is outside the allowed window.");
  }

  const provided = String(signature).startsWith("sha256=") ? String(signature).slice(7) : String(signature);
  const expected = signPayload({ timestamp: String(timestamp), eventId: String(eventId), rawBody });
  const left = Buffer.from(provided, "hex");
  const right = Buffer.from(expected, "hex");
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("Integration signature is invalid.");
  }
}

function mapOrderStatus(status) {
  const mapping = {
    pending: "PROCESSING",
    confirmed: "PROCESSING",
    inProcess: "PROCESSING",
    inShipping: "SHIPPED",
    delivered: "DELIVERED",
    rejected: "CANCELLED",
  };
  return mapping[status] || "PROCESSING";
}

function resolveDeliveredAt(order) {
  if (order.orderStatus !== "delivered") return null;
  const deliveredAt = order.shipping?.deliveredAt || order.orderUpdateDate || order.orderDate;
  return deliveredAt ? new Date(deliveredAt).toISOString() : null;
}

async function buildBusinessSnapshot(customer, orders) {
  const productIds = [...new Set(
    orders.flatMap((order) => order.cartItems.map((item) => String(item.productId))),
  )];
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
    : [];
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  return {
    customer: {
      id: String(customer._id),
      name: customer.userName,
      email: customer.email,
      accountStatus: customer.accountStatus || "ACTIVE",
      riskLevel: customer.riskLevel || "LOW",
      lifetimeOrders: customer.lifetimeOrders || orders.length,
      lifetimeRefunds: customer.lifetimeRefunds || 0,
      createdAt: customer.createdAt || new Date().toISOString(),
    },
    orders: orders.map((order) => ({
      id: String(order._id),
      customerId: String(customer._id),
      status: mapOrderStatus(order.orderStatus),
      currency: "USD",
      subtotalCents: Math.round(order.totalAmount * 100),
      shippingCents: 0,
      taxCents: 0,
      totalPaidCents: Math.round(order.totalAmount * 100),
      refundedCents: Math.round((order.refundedAmount || 0) * 100),
      placedAt: new Date(order.orderDate).toISOString(),
      deliveredAt: resolveDeliveredAt(order),
      items: order.cartItems.map((item, index) => {
        const product = productMap.get(String(item.productId));
        return {
          id: `${String(order._id)}_item_${index}`,
          sku: String(item.productId),
          name: item.title,
          quantity: item.quantity,
          unitPriceCents: Math.round(item.price * 100),
          finalSale: Boolean(product?.finalSale),
          refundable: product?.refundable !== false,
        };
      }),
    })),
  };
}

async function syncBusinessContext(customer, orders) {
  if (!isConfigured()) {
    console.warn("[Jobform] Integration not configured — skipping sync");
    return null;
  }

  const payload = await buildBusinessSnapshot(customer, orders);
  const rawBody = JSON.stringify(payload);
  const headers = buildHeaders(rawBody);

  const response = await fetch(
    `${JOBFORM_BASE_URL}/api/integrations/business/context`,
    { method: "POST", headers, body: rawBody },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jobform business sync failed (${response.status}): ${err}`);
  }

  return response.json();
}

async function launchSupport(customerId, orderId) {
  if (!isConfigured()) {
    return null;
  }

  const payload = { customerId: String(customerId), orderId: String(orderId) };
  const rawBody = JSON.stringify(payload);
  const headers = buildHeaders(rawBody);

  const response = await fetch(
    `${JOBFORM_BASE_URL}/api/integrations/support/launch`,
    { method: "POST", headers, body: rawBody },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jobform support launch failed (${response.status}): ${err}`);
  }

  return response.json();
}

module.exports = {
  syncBusinessContext,
  launchSupport,
  buildBusinessSnapshot,
  verifyJobformRequest,
  isConfigured,
};
