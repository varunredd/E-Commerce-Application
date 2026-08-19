const crypto = require("crypto");

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

/**
 * Sync customer + order data to Jobform so the support agent has context.
 * Expects Jobform's BusinessContextSnapshot format:
 * { customer: { id, name, email, accountStatus, riskLevel, lifetimeOrders, lifetimeRefunds, createdAt },
 *   orders: [{ id, customerId, status, currency, subtotalCents, shippingCents, taxCents,
 *              totalPaidCents, refundedCents, placedAt, deliveredAt, items: [...] }] }
 */
async function syncBusinessContext(customer, orders) {
  if (!isConfigured()) {
    console.warn("[Jobform] Integration not configured — skipping sync");
    return null;
  }

  const payload = {
    customer: {
      id: String(customer._id),
      name: customer.userName,
      email: customer.email,
      accountStatus: "ACTIVE",
      riskLevel: "LOW",
      lifetimeOrders: customer.lifetimeOrders || orders.length,
      lifetimeRefunds: 0,
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
      refundedCents: 0,
      placedAt: new Date(order.orderDate).toISOString(),
      deliveredAt: order.orderStatus === "delivered"
        ? new Date(order.orderUpdateDate).toISOString()
        : null,
      items: order.cartItems.map((item, i) => ({
        id: `${String(order._id)}_item_${i}`,
        sku: String(item.productId),
        name: item.title,
        quantity: item.quantity,
        unitPriceCents: Math.round(item.price * 100),
        finalSale: false,
        refundable: true,
      })),
    })),
  };

  const rawBody = JSON.stringify(payload);
  const headers = buildHeaders(rawBody);

  const response = await fetch(
    `${JOBFORM_BASE_URL}/api/integrations/business/context`,
    { method: "POST", headers, body: rawBody }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jobform business sync failed (${response.status}): ${err}`);
  }

  return response.json();
}

/**
 * Launch a support session for a specific customer + order.
 * Returns { launchUrl, expiresInSeconds }.
 */
async function launchSupport(customerId, orderId) {
  if (!isConfigured()) {
    return null;
  }

  const payload = { customerId: String(customerId), orderId: String(orderId) };
  const rawBody = JSON.stringify(payload);
  const headers = buildHeaders(rawBody);

  const response = await fetch(
    `${JOBFORM_BASE_URL}/api/integrations/support/launch`,
    { method: "POST", headers, body: rawBody }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jobform support launch failed (${response.status}): ${err}`);
  }

  return response.json();
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

module.exports = { syncBusinessContext, launchSupport, isConfigured };
