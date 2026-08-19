const RETURN_STATUS_LABELS = {
  REFUND_APPROVED: "Refund initiated",
  PICKUP_SCHEDULED: "Pickup scheduled",
  PICKED_UP: "Item picked up",
  IN_TRANSIT: "Return in transit",
  RECEIVED: "Item received",
  REFUND_COMPLETED: "Refund completed",
  RETURN_CANCELLED: "Return cancelled",
};

const RETURN_PROGRESSION = [
  {
    hours: 24,
    status: "PICKED_UP",
    eventStatus: "picked_up",
    description: "Return item picked up by agent",
  },
  {
    hours: 48,
    status: "IN_TRANSIT",
    eventStatus: "in_transit",
    description: "Return package in transit to warehouse",
  },
  {
    hours: 72,
    status: "RECEIVED",
    eventStatus: "received",
    description: "Item received at NovaShop returns center",
  },
  {
    hours: 96,
    status: "REFUND_COMPLETED",
    eventStatus: "refund_completed",
    description: "Refund processed to original payment method",
  },
];

const FALLBACK_AGENT_NAMES = ["Alex Rivera", "Jordan Kim", "Sam Patel"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextBusinessDay(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(10, 0, 0, 0);
  return d;
}

function buildPickupWindow(pickupDate) {
  const start = new Date(pickupDate);
  start.setHours(10, 0, 0, 0);
  const end = new Date(pickupDate);
  end.setHours(14, 0, 0, 0);
  return { start, end };
}

function resolveItemFromOrder(order, itemId) {
  const match = String(itemId).match(/_item_(\d+)$/);
  if (match) {
    const item = order.cartItems?.[Number(match[1])];
    if (item) {
      return { title: item.title, sku: String(item.productId) };
    }
  }

  const byProduct = order.cartItems?.find(
    (item) => String(item.productId) === String(itemId),
  );
  if (byProduct) {
    return { title: byProduct.title, sku: String(byProduct.productId) };
  }

  return { title: "Item", sku: String(itemId) };
}

function buildReturnTrackingNumber(refundId) {
  return `RTN-${String(refundId).slice(-8).toUpperCase()}`;
}

function initializeReturnPickup(order, refundId) {
  const pickupScheduledAt = nextBusinessDay();
  const { start, end } = buildPickupWindow(pickupScheduledAt);
  const agentName =
    process.env.RETURN_PICKUP_AGENT_NAME?.trim() || pickRandom(FALLBACK_AGENT_NAMES);
  const agentPhone =
    process.env.RETURN_PICKUP_AGENT_PHONE?.trim() || "+1-800-555-0199";
  const estimatedRefundAt = new Date(pickupScheduledAt);
  estimatedRefundAt.setDate(estimatedRefundAt.getDate() + 5);
  const now = new Date();
  const trackingNumber = buildReturnTrackingNumber(refundId);

  order.returnStatus = "PICKUP_SCHEDULED";
  order.returnShipping = {
    carrier: "NovaShop Returns",
    trackingNumber,
    pickupScheduledAt,
    pickupWindowStart: start,
    pickupWindowEnd: end,
    agentName,
    agentPhone,
    estimatedRefundAt,
    events: [
      {
        status: "refund_approved",
        location: "",
        timestamp: now,
        description: "Refund approved — return initiated",
      },
      {
        status: "pickup_scheduled",
        location: order.addressInfo?.city || "",
        timestamp: now,
        description: `Pickup scheduled for ${pickupScheduledAt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}, 10:00 AM – 2:00 PM`,
      },
    ],
  };

  return order.returnShipping;
}

function advanceReturnStatusIfDue(order) {
  if (
    !order.returnStatus ||
    order.returnStatus === "REFUND_COMPLETED" ||
    order.returnStatus === "RETURN_CANCELLED"
  ) {
    return { changed: false, newStatus: order.returnStatus || null };
  }

  if (order.returnStatus === "REFUND_APPROVED" && !order.returnShipping?.pickupScheduledAt) {
    const refundId = order.refundRecords?.at(-1)?.refundId || "legacy";
    initializeReturnPickup(order, refundId);
    order.orderUpdateDate = new Date();
    return { changed: true, newStatus: "PICKUP_SCHEDULED" };
  }

  const base = order.returnShipping?.pickupScheduledAt;
  if (!base) {
    return { changed: false, newStatus: order.returnStatus };
  }

  const hoursElapsed =
    (Date.now() - new Date(base).getTime()) / (1000 * 60 * 60);
  const existingEventStatuses = new Set(
    (order.returnShipping.events || []).map((event) => event.status),
  );
  let changed = false;
  let newStatus = order.returnStatus;

  for (const step of RETURN_PROGRESSION) {
    if (hoursElapsed >= step.hours && !existingEventStatuses.has(step.eventStatus)) {
      order.returnShipping.events.push({
        status: step.eventStatus,
        location: order.addressInfo?.city || "",
        timestamp: new Date(
          new Date(base).getTime() + step.hours * 60 * 60 * 1000,
        ),
        description: step.description,
      });
      order.returnStatus = step.status;
      existingEventStatuses.add(step.eventStatus);
      changed = true;
      newStatus = step.status;
    }
  }

  if (changed) {
    order.orderUpdateDate = new Date();
  }

  return { changed, newStatus };
}

module.exports = {
  RETURN_STATUS_LABELS,
  RETURN_PROGRESSION,
  resolveItemFromOrder,
  buildReturnTrackingNumber,
  initializeReturnPickup,
  advanceReturnStatusIfDue,
};
