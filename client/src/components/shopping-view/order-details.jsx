import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  CircleDot,
  RotateCcw,
  Copy,
  Check,
  Headphones,
} from "lucide-react";
import {
  getReturnStatusBadgeClass,
  getReturnStatusLabel,
  getOrderStatusBadgeClass,
  RETURN_EVENT_LABELS,
} from "@/lib/return-status";
import api from "@/lib/api";

const STATUS_ICONS = {
  label_created: Package,
  picked_up: Package,
  in_transit: Truck,
  local_facility: MapPin,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  refund_approved: RotateCcw,
  pickup_scheduled: Clock,
  received: Package,
  refund_completed: CheckCircle2,
};

const STATUS_LABELS = {
  label_created: "Label Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  local_facility: "At Local Facility",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function EventTimeline({ events, statusLabels = STATUS_LABELS }) {
  if (!events?.length) return null;

  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, idx) => {
        const Icon = STATUS_ICONS[event.status] || CircleDot;
        const isLatest = idx === 0;
        const isLast = idx === sorted.length - 1;
        return (
          <div key={`${event.status}-${idx}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full p-1.5 ${
                  isLatest
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="w-px h-8 bg-border" />}
            </div>
            <div className="pb-4">
              <p
                className={`text-sm font-medium leading-tight ${
                  isLatest ? "" : "text-muted-foreground"
                }`}
              >
                {event.description ||
                  statusLabels[event.status] ||
                  RETURN_EVENT_LABELS[event.status] ||
                  event.status}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(event.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {event.location && ` · ${event.location}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShoppingOrderDetailsView({ orderDetails }) {
  const { user } = useSelector((state) => state.auth);
  const [copied, setCopied] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);

  const itemCount = Array.isArray(orderDetails?.cartItems)
    ? orderDetails.cartItems.length
    : 0;

  const computedTotal = useMemo(() => {
    if (typeof orderDetails?.totalAmount === "number") {
      return orderDetails.totalAmount;
    }
    if (!Array.isArray(orderDetails?.cartItems)) return 0;
    return orderDetails.cartItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [orderDetails]);

  const shipping = orderDetails?.shipping;
  const hasShipping = shipping?.trackingNumber;
  const returnShipping = orderDetails?.returnShipping;
  const hasReturn = Boolean(orderDetails?.returnStatus);
  const refundedAmount = Number(orderDetails?.refundedAmount || 0);
  const remainingBalance = Math.max(computedTotal - refundedAmount, 0);

  async function copyTracking() {
    if (!returnShipping?.trackingNumber) return;
    await navigator.clipboard.writeText(returnShipping.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGetHelp() {
    if (!orderDetails?._id) return;
    setHelpLoading(true);
    try {
      const response = await api.post("/api/integrations/support/launch", {
        orderId: orderDetails._id,
      });
      const launchUrl = response.data?.data?.launchUrl;
      if (launchUrl) {
        window.open(launchUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Support launch failed:", error);
    } finally {
      setHelpLoading(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="mt-6 flex items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label className="font-mono text-xs">
              #{String(orderDetails?._id || "").slice(-8).toUpperCase()}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>
              {orderDetails?.orderDate
                ? new Date(orderDetails.orderDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "-"}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Items</p>
            <Label>{itemCount}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Total</p>
            <div className="text-right">
              <Label className="font-semibold">
                ${Number(computedTotal || 0).toFixed(2)}
              </Label>
              {refundedAmount > 0 && (
                <p className="text-xs text-emerald-600">
                  Refunded ${refundedAmount.toFixed(2)}
                  {remainingBalance > 0 && ` · $${remainingBalance.toFixed(2)} remaining`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Payment</p>
            <Label>
              {orderDetails?.paymentMethod || "-"} ·{" "}
              {orderDetails?.paymentStatus || "-"}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Delivery</p>
            <Badge
              className={`py-1 px-3 ${getOrderStatusBadgeClass(orderDetails?.orderStatus)}`}
            >
              {orderDetails?.orderStatus || "-"}
            </Badge>
          </div>

          {hasReturn && (
            <div className="mt-2 flex items-center justify-between">
              <p className="font-medium">Return</p>
              <Badge
                className={`py-1 px-3 ${getReturnStatusBadgeClass(orderDetails.returnStatus)}`}
              >
                {getReturnStatusLabel(orderDetails.returnStatus)}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {hasReturn && (
          <>
            <div className="grid gap-4">
              <div className="font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Return & Refund
              </div>

              <div className="rounded-xl border bg-secondary/30 p-4 space-y-3">
                {orderDetails.refundRecords?.map((record) => (
                  <div key={record.refundId} className="text-sm space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">
                        {record.itemTitle || "Item"} · Qty {record.quantity}
                      </span>
                      <span className="font-semibold">
                        ${Number(record.amount || 0).toFixed(2)}
                      </span>
                    </div>
                    {(record.reason || record.condition) && (
                      <p className="text-muted-foreground text-xs">
                        {[record.reason, record.condition].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}

                {returnShipping?.pickupScheduledAt && (
                  <div className="pt-2 border-t space-y-2 text-sm">
                    <p className="font-medium">Pickup scheduled</p>
                    <p>
                      {new Date(returnShipping.pickupScheduledAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      {returnShipping.pickupWindowStart &&
                        returnShipping.pickupWindowEnd &&
                        ` · ${new Date(returnShipping.pickupWindowStart).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })} – ${new Date(returnShipping.pickupWindowEnd).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}`}
                    </p>
                    {returnShipping.agentName && (
                      <p className="text-muted-foreground">
                        Agent: {returnShipping.agentName}
                        {returnShipping.agentPhone && ` · ${returnShipping.agentPhone}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground italic">
                      Keep item in original packaging. Agent will call ~30 min before arrival.
                    </p>
                  </div>
                )}

                {returnShipping?.trackingNumber && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Return tracking</p>
                      <p className="font-mono text-sm">{returnShipping.trackingNumber}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void copyTracking()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}

                {returnShipping?.estimatedRefundAt && (
                  <p className="text-xs text-muted-foreground">
                    Est. refund by{" "}
                    {new Date(returnShipping.estimatedRefundAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {returnShipping?.events?.length > 0 && (
                <EventTimeline events={returnShipping.events} />
              )}

              <Button
                variant="outline"
                className="w-full"
                disabled={helpLoading}
                onClick={() => void handleGetHelp()}
              >
                <Headphones className="h-4 w-4 mr-2" />
                {helpLoading ? "Opening support…" : "Questions? Get help"}
              </Button>
            </div>

            <Separator />
          </>
        )}

        {hasShipping && (
          <>
            <div className="grid gap-4">
              <div className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipment Tracking
              </div>

              <div className="rounded-xl border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Carrier</span>
                  <span className="font-semibold">{shipping.carrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tracking #</span>
                  <span className="font-mono text-sm">{shipping.trackingNumber}</span>
                </div>
              </div>

              <EventTimeline events={shipping.events} />
            </div>

            <Separator />
          </>
        )}

        <div className="grid gap-4">
          <div className="font-medium">Order Items</div>
          <ul className="grid gap-3">
            {orderDetails?.cartItems?.length > 0 ? (
              orderDetails.cartItems.map((item, index) => (
                <li key={index} className="rounded-md border p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">{item.title}</span>
                    <span>Qty: {item.quantity}</span>
                    <span>${Number(item.price || 0).toFixed(2)}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No items found.</li>
            )}
          </ul>
        </div>

        <div className="grid gap-2">
          <div className="font-medium">Delivery Address</div>
          <div className="grid gap-0.5 text-sm text-muted-foreground">
            <span>{user?.userName || "-"}</span>
            <span>{orderDetails?.addressInfo?.address || "-"}</span>
            <span>
              {orderDetails?.addressInfo?.city || "-"},{" "}
              {orderDetails?.addressInfo?.pincode || "-"}
            </span>
            <span>{orderDetails?.addressInfo?.phone || "-"}</span>
          </div>
        </div>

        {!hasReturn && orderDetails?.orderStatus === "delivered" && (
          <Button
            variant="outline"
            disabled={helpLoading}
            onClick={() => void handleGetHelp()}
          >
            <Headphones className="h-4 w-4 mr-2" />
            {helpLoading ? "Opening support…" : "Get help with this order"}
          </Button>
        )}
      </div>
    </DialogContent>
  );
}

ShoppingOrderDetailsView.propTypes = {
  orderDetails: PropTypes.object,
};

export default ShoppingOrderDetailsView;
