const crypto = require("crypto");
const Product = require("../models/Product");

function getJobformBaseUrl() {
  return (process.env.JOBFORM_BASE_URL || "").trim().replace(/\/$/, "");
}

function getIntegrationSecret() {
  return (process.env.BUSINESS_INTEGRATION_SECRET || "").trim();
}

function isConfigured() {
  return getJobformBaseUrl().length > 0 && getIntegrationSecret().length >= 32;
}

function signPayload({ timestamp, eventId, rawBody }) {
  return crypto
    .createHmac("sha256", getIntegrationSecret())
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
  const secret = getIntegrationSecret();
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
  if (mapOrderStatus(order.orderStatus) !== "DELIVERED") return null;
  const deliveredAt = order.shipping?.deliveredAt || order.orderUpdateDate || order.orderDate;
  return deliveredAt ? new Date(deliveredAt).toISOString() : null;
}

function orderSubtotalCents(order) {
  const fromItems = (order.cartItems || []).reduce(
    (sum, item) => sum + Math.round(Number(item.price || 0) * 100) * Number(item.quantity || 0),
    0,
  );
  if (fromItems > 0) return fromItems;
  const shippingCents = Math.round(Number(order.shippingAmount || 0) * 100);
  const taxCents = Math.round(Number(order.taxAmount || 0) * 100);
  return Math.max(0, Math.round(Number(order.totalAmount || 0) * 100) - shippingCents - taxCents);
}

function resolveItemFlags(item, product) {
  const finalSale =
    typeof item.finalSale === "boolean"
      ? item.finalSale
      : Boolean(product?.finalSale);
  const refundable =
    typeof item.refundable === "boolean"
      ? item.refundable
      : product?.refundable !== false;
  return { finalSale, refundable };
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
      createdAt: customer.createdAt
        ? new Date(customer.createdAt).toISOString()
        : new Date().toISOString(),
    },
    orders: orders.map((order) => {
      const shippingCents = Math.round(Number(order.shippingAmount || 0) * 100);
      const taxCents = Math.round(Number(order.taxAmount || 0) * 100);
      const subtotalCents = orderSubtotalCents(order);
      const totalPaidCents =
        shippingCents + taxCents > 0
          ? subtotalCents + shippingCents + taxCents
          : Math.round(Number(order.totalAmount || 0) * 100);

      return {
        id: String(order._id),
        customerId: String(customer._id),
        status: mapOrderStatus(order.orderStatus),
        currency: "USD",
        subtotalCents,
        shippingCents,
        taxCents,
        totalPaidCents,
        refundedCents: Math.round((order.refundedAmount || 0) * 100),
        placedAt: new Date(order.orderDate).toISOString(),
        deliveredAt: resolveDeliveredAt(order),
        items: order.cartItems.map((item, index) => {
          const product = productMap.get(String(item.productId));
          const flags = resolveItemFlags(item, product);
          return {
            id: `${String(order._id)}_item_${index}`,
            sku: String(item.productId),
            name: item.title,
            quantity: item.quantity,
            unitPriceCents: Math.round(item.price * 100),
            finalSale: flags.finalSale,
            refundable: flags.refundable,
          };
        }),
      };
    }),
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
    `${getJobformBaseUrl()}/api/integrations/business/context`,
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
    `${getJobformBaseUrl()}/api/integrations/support/launch`,
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
