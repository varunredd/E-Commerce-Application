export const RETURN_STATUS_LABELS = {
  REFUND_APPROVED: "Refund initiated",
  PICKUP_SCHEDULED: "Pickup scheduled",
  PICKED_UP: "Item picked up",
  IN_TRANSIT: "Return in transit",
  RECEIVED: "Item received",
  REFUND_COMPLETED: "Refund completed",
  RETURN_CANCELLED: "Return cancelled",
};

export const RETURN_STATUS_BADGE_CLASS = {
  REFUND_APPROVED: "bg-amber-500 hover:bg-amber-500",
  PICKUP_SCHEDULED: "bg-purple-600 hover:bg-purple-600",
  PICKED_UP: "bg-blue-600 hover:bg-blue-600",
  IN_TRANSIT: "bg-blue-600 hover:bg-blue-600",
  RECEIVED: "bg-teal-600 hover:bg-teal-600",
  REFUND_COMPLETED: "bg-emerald-600 hover:bg-emerald-600",
  RETURN_CANCELLED: "bg-gray-500 hover:bg-gray-500",
};

export const ORDER_STATUS_BADGE_CLASS = {
  confirmed: "bg-green-500 hover:bg-green-500",
  rejected: "bg-red-600 hover:bg-red-600",
  inShipping: "bg-blue-600 hover:bg-blue-600",
  delivered: "bg-emerald-600 hover:bg-emerald-600",
  inProcess: "bg-black hover:bg-black",
  pending: "bg-black hover:bg-black",
};

export function getReturnStatusLabel(returnStatus) {
  if (!returnStatus) return null;
  return RETURN_STATUS_LABELS[returnStatus] || returnStatus.replace(/_/g, " ");
}

export function getOrderStatusBadgeClass(orderStatus) {
  return ORDER_STATUS_BADGE_CLASS[orderStatus] || "bg-black hover:bg-black";
}

export function getReturnStatusBadgeClass(returnStatus) {
  return RETURN_STATUS_BADGE_CLASS[returnStatus] || "bg-amber-500 hover:bg-amber-500";
}

export const RETURN_EVENT_ICONS = {
  refund_approved: "initiated",
  pickup_scheduled: "scheduled",
  picked_up: "picked_up",
  in_transit: "in_transit",
  received: "received",
  refund_completed: "completed",
};

export const RETURN_EVENT_LABELS = {
  refund_approved: "Refund approved",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  in_transit: "In transit",
  received: "Received at warehouse",
  refund_completed: "Refund completed",
};
