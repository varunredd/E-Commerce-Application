import { useMemo } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { Badge } from "../ui/badge";
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
} from "lucide-react";

const STATUS_ICONS = {
  label_created: Package,
  picked_up: Package,
  in_transit: Truck,
  local_facility: MapPin,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

const STATUS_LABELS = {
  label_created: "Label Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  local_facility: "At Local Facility",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function ShoppingOrderDetailsView({ orderDetails }) {
  const { user } = useSelector((state) => state.auth);

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
  const events = shipping?.events
    ? [...shipping.events].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )
    : [];
  const latestEvent = events[0];

  return (
    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
      <div className="grid gap-6">
        {/* Order summary */}
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
            <Label className="font-semibold">
              ${Number(computedTotal || 0).toFixed(2)}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Payment</p>
            <Label>
              {orderDetails?.paymentMethod || "-"} ·{" "}
              {orderDetails?.paymentStatus || "-"}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Status</p>
            <Badge
              className={`py-1 px-3 ${
                orderDetails?.orderStatus === "confirmed"
                  ? "bg-green-500"
                  : orderDetails?.orderStatus === "rejected"
                  ? "bg-red-600"
                  : orderDetails?.orderStatus === "inShipping"
                  ? "bg-blue-600"
                  : orderDetails?.orderStatus === "delivered"
                  ? "bg-emerald-600"
                  : "bg-black"
              }`}
            >
              {orderDetails?.orderStatus || "-"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Tracking section */}
        {hasShipping && (
          <>
            <div className="grid gap-4">
              <div className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipment Tracking
              </div>

              {/* Tracking summary card */}
              <div className="rounded-xl border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Carrier</span>
                  <span className="font-semibold">{shipping.carrier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tracking #
                  </span>
                  <span className="font-mono text-sm">
                    {shipping.trackingNumber}
                  </span>
                </div>
                {shipping.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Est. Delivery
                    </span>
                    <span className="font-medium">
                      {new Date(shipping.estimatedDelivery).toLocaleDateString(
                        "en-US",
                        { weekday: "short", month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                )}
                {latestEvent && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm text-muted-foreground">
                      Current Status
                    </span>
                    <Badge
                      variant="outline"
                      className={`${
                        latestEvent.status === "delivered"
                          ? "border-emerald-500 text-emerald-600"
                          : latestEvent.status === "out_for_delivery"
                          ? "border-blue-500 text-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {STATUS_LABELS[latestEvent.status] || latestEvent.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {events.length > 0 && (
                <div className="space-y-0">
                  {events.map((event, idx) => {
                    const Icon = STATUS_ICONS[event.status] || CircleDot;
                    const isLatest = idx === 0;
                    const isLast = idx === events.length - 1;
                    return (
                      <div key={idx} className="flex gap-3">
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
                          {!isLast && (
                            <div className="w-px h-8 bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm font-medium leading-tight ${
                              isLatest ? "" : "text-muted-foreground"
                            }`}
                          >
                            {event.description}
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
              )}
            </div>

            <Separator />
          </>
        )}

        {/* Order items */}
        <div className="grid gap-4">
          <div className="font-medium">Order Items</div>
          <ul className="grid gap-3">
            {orderDetails?.cartItems && orderDetails.cartItems.length > 0 ? (
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
              <li className="text-sm text-muted-foreground">
                No items found in this order.
              </li>
            )}
          </ul>
        </div>

        {/* Delivery address */}
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
            {orderDetails?.addressInfo?.notes && (
              <span className="italic">{orderDetails.addressInfo.notes}</span>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

ShoppingOrderDetailsView.propTypes = {
  orderDetails: PropTypes.shape({
    _id: PropTypes.string,
    orderDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    totalAmount: PropTypes.number,
    paymentMethod: PropTypes.string,
    paymentStatus: PropTypes.string,
    orderStatus: PropTypes.string,
    cartItems: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        quantity: PropTypes.number,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      })
    ),
    addressInfo: PropTypes.shape({
      address: PropTypes.string,
      city: PropTypes.string,
      pincode: PropTypes.string,
      phone: PropTypes.string,
      notes: PropTypes.string,
    }),
    shipping: PropTypes.shape({
      carrier: PropTypes.string,
      trackingNumber: PropTypes.string,
      estimatedDelivery: PropTypes.string,
      shippedAt: PropTypes.string,
      deliveredAt: PropTypes.string,
      events: PropTypes.arrayOf(
        PropTypes.shape({
          status: PropTypes.string,
          location: PropTypes.string,
          timestamp: PropTypes.string,
          description: PropTypes.string,
        })
      ),
    }),
  }),
};

export default ShoppingOrderDetailsView;
