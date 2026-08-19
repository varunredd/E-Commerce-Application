const crypto = require("crypto");

const CARRIERS = ["UPS", "FedEx", "USPS"];

const TRACKING_PREFIXES = {
  UPS: "1Z999AA1",
  FedEx: "7489",
  USPS: "9400111899",
};

const CITIES = [
  "Los Angeles, CA",
  "Chicago, IL",
  "Dallas, TX",
  "Denver, CO",
  "Memphis, TN",
  "Louisville, KY",
  "Indianapolis, IN",
  "Atlanta, GA",
];

function generateTrackingNumber(carrier) {
  const prefix = TRACKING_PREFIXES[carrier] || "TRACK";
  const suffix = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
  return `${prefix}${suffix}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a complete demo shipment with simulated tracking events.
 * Events are spread across a realistic timeline from order confirmation
 * to estimated delivery (3-5 business days).
 */
function generateDemoShipment(order) {
  const carrier = pickRandom(CARRIERS);
  const trackingNumber = generateTrackingNumber(carrier);
  const now = new Date();
  const deliveryDays = 3 + Math.floor(Math.random() * 3); // 3-5 days
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

  const city = order.addressInfo?.city || "Your City";

  const events = [
    {
      status: "label_created",
      location: pickRandom(CITIES),
      timestamp: now,
      description: "Shipping label created, package awaiting pickup",
    },
  ];

  return {
    carrier,
    trackingNumber,
    estimatedDelivery,
    shippedAt: now,
    deliveredAt: null,
    events,
  };
}

/**
 * Progress the shipping timeline based on elapsed time since shipment.
 * Called when a customer views their order — adds events that "should have
 * happened" by now based on the time elapsed since shippedAt.
 *
 * Returns true if new events were added (order needs saving).
 */
function progressShippingTimeline(order) {
  const shipping = order.shipping;
  if (!shipping || !shipping.shippedAt || !shipping.trackingNumber) return false;

  const now = new Date();
  const shippedAt = new Date(shipping.shippedAt);
  const hoursElapsed = (now - shippedAt) / (1000 * 60 * 60);
  const existingStatuses = new Set(shipping.events.map((e) => e.status));
  const city = order.addressInfo?.city || "Your City";
  let changed = false;

  // 2+ hours: picked up
  if (hoursElapsed >= 2 && !existingStatuses.has("picked_up")) {
    shipping.events.push({
      status: "picked_up",
      location: pickRandom(CITIES),
      timestamp: new Date(shippedAt.getTime() + 2 * 60 * 60 * 1000),
      description: `Package picked up by ${shipping.carrier}`,
    });
    changed = true;
  }

  // 12+ hours: in transit
  if (hoursElapsed >= 12 && !existingStatuses.has("in_transit")) {
    shipping.events.push({
      status: "in_transit",
      location: pickRandom(CITIES),
      timestamp: new Date(shippedAt.getTime() + 12 * 60 * 60 * 1000),
      description: "Package in transit to destination",
    });
    if (order.orderStatus === "confirmed" || order.orderStatus === "inProcess") {
      order.orderStatus = "inShipping";
    }
    changed = true;
  }

  // 36+ hours: arrived at local facility
  if (hoursElapsed >= 36 && !existingStatuses.has("local_facility")) {
    shipping.events.push({
      status: "local_facility",
      location: city,
      timestamp: new Date(shippedAt.getTime() + 36 * 60 * 60 * 1000),
      description: `Arrived at local ${shipping.carrier} facility`,
    });
    changed = true;
  }

  // 60+ hours: out for delivery
  if (hoursElapsed >= 60 && !existingStatuses.has("out_for_delivery")) {
    shipping.events.push({
      status: "out_for_delivery",
      location: city,
      timestamp: new Date(shippedAt.getTime() + 60 * 60 * 60 * 1000),
      description: "Out for delivery",
    });
    changed = true;
  }

  // 72+ hours: delivered
  if (hoursElapsed >= 72 && !existingStatuses.has("delivered")) {
    const deliveredTime = new Date(shippedAt.getTime() + 72 * 60 * 60 * 1000);
    shipping.events.push({
      status: "delivered",
      location: city,
      timestamp: deliveredTime,
      description: "Package delivered — left at front door",
    });
    shipping.deliveredAt = deliveredTime;
    order.orderStatus = "delivered";
    changed = true;
  }

  return changed;
}

const STATUS_LABELS = {
  label_created: "Label Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  local_facility: "At Local Facility",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

module.exports = {
  generateDemoShipment,
  progressShippingTimeline,
  STATUS_LABELS,
};
