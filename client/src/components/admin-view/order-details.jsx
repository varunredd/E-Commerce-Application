import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import CommonForm from "../common/form";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  updateOrderStatus,
} from "@/store/admin/order-slice";
import { useToast } from "../ui/use-toast";

import {
  getReturnStatusBadgeClass,
  getReturnStatusLabel,
  getOrderStatusBadgeClass,
} from "@/lib/return-status";

const initialFormData = {
  status: "",
  returnStatus: "",
};

function AdminOrderDetailsView({ orderDetails }) {
  const [formData, setFormData] = useState(initialFormData);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (orderDetails) {
      setFormData({
        status: orderDetails.orderStatus || "",
        returnStatus: orderDetails.returnStatus || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [orderDetails]);

  const visibleItems = orderDetails?.cartItems || [];

  const visibleAmount = useMemo(() => {
    if (typeof orderDetails?.adminVisibleTotalAmount === "number") {
      return orderDetails.adminVisibleTotalAmount;
    }

    return visibleItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [orderDetails, visibleItems]);

  function handleUpdateStatus(event) {
    event.preventDefault();
    const { status, returnStatus } = formData;

    if (!status || !orderDetails?._id) return;

    dispatch(
      updateOrderStatus({
        id: orderDetails._id,
        orderStatus: status,
        returnStatus: returnStatus || "",
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(getOrderDetailsForAdmin(orderDetails._id));
        dispatch(getAllOrdersForAdmin());
        toast({
          title: data?.payload?.message,
        });
      }
    });
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="mt-6 flex items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label>{orderDetails?._id || "-"}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>
              {orderDetails?.orderDate
                ? String(orderDetails.orderDate).split("T")[0]
                : "-"}
            </Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">My Items</p>
            <Label>{visibleItems.length}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">My Amount</p>
            <Label>${visibleAmount.toFixed(2)}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Payment Method</p>
            <Label>{orderDetails?.paymentMethod || "-"}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label>{orderDetails?.paymentStatus || "-"}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Order Status</p>
            <Badge
              className={`py-1 px-3 ${getOrderStatusBadgeClass(orderDetails?.orderStatus)}`}
            >
              {orderDetails?.orderStatus || "-"}
            </Badge>
          </div>

          {orderDetails?.returnStatus && (
            <div className="mt-2 flex items-center justify-between">
              <p className="font-medium">Return Status</p>
              <Badge
                className={`py-1 px-3 ${getReturnStatusBadgeClass(orderDetails.returnStatus)}`}
              >
                {getReturnStatusLabel(orderDetails.returnStatus)}
              </Badge>
            </div>
          )}

          {Number(orderDetails?.refundedAmount || 0) > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <p className="font-medium">Refunded</p>
              <Label className="text-emerald-600 font-semibold">
                ${Number(orderDetails.refundedAmount).toFixed(2)}
              </Label>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Products You Own In This Order</div>

            <ul className="grid gap-3">
              {visibleItems.length > 0 ? (
                visibleItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium">{item.title}</span>
                    <span>Quantity: {item.quantity}</span>
                    <span>Price: ${Number(item.price || 0).toFixed(2)}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No visible items for this order.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Shipping Info</div>
            <div className="grid gap-0.5 text-muted-foreground">
              <span>{user?.userName || "-"}</span>
              <span>{orderDetails?.addressInfo?.address || "-"}</span>
              <span>{orderDetails?.addressInfo?.city || "-"}</span>
              <span>{orderDetails?.addressInfo?.pincode || "-"}</span>
              <span>{orderDetails?.addressInfo?.phone || "-"}</span>
              <span>{orderDetails?.addressInfo?.notes || "-"}</span>
            </div>
          </div>
        </div>

        {orderDetails?.shipping?.trackingNumber && (
          <div className="grid gap-2">
            <div className="font-medium">Tracking</div>
            <div className="grid gap-0.5 text-muted-foreground text-sm">
              <span>Carrier: {orderDetails.shipping.carrier}</span>
              <span className="font-mono">Tracking #: {orderDetails.shipping.trackingNumber}</span>
              {orderDetails.shipping.estimatedDelivery && (
                <span>
                  Est. Delivery:{" "}
                  {new Date(orderDetails.shipping.estimatedDelivery).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                  })}
                </span>
              )}
              {orderDetails.shipping.deliveredAt && (
                <span className="text-green-600 font-medium">
                  Delivered: {new Date(orderDetails.shipping.deliveredAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {orderDetails?.returnStatus && (
          <div className="grid gap-4">
            <div className="font-medium">Return & Refund</div>
            <div className="rounded-md border p-3 text-sm space-y-2">
              {orderDetails.refundRecords?.map((record) => (
                <div key={record.refundId} className="flex justify-between gap-2">
                  <span>
                    {record.itemTitle || record.itemId} · Qty {record.quantity}
                  </span>
                  <span className="font-medium">${Number(record.amount || 0).toFixed(2)}</span>
                </div>
              ))}
              {orderDetails.returnShipping?.trackingNumber && (
                <p className="font-mono text-xs pt-2 border-t">
                  Return tracking: {orderDetails.returnShipping.trackingNumber}
                </p>
              )}
              {orderDetails.returnShipping?.agentName && (
                <p className="text-muted-foreground text-xs">
                  Agent: {orderDetails.returnShipping.agentName}
                  {orderDetails.returnShipping.agentPhone &&
                    ` · ${orderDetails.returnShipping.agentPhone}`}
                </p>
              )}
              {orderDetails.returnShipping?.events?.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  {orderDetails.returnShipping.events.map((event, idx) => (
                    <li key={idx}>
                      {event.description} ·{" "}
                      {new Date(event.timestamp).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div>
          <CommonForm
            formControls={[
              {
                label: "Order Status",
                name: "status",
                componentType: "select",
                options: [
                  { id: "pending", label: "Pending" },
                  { id: "inProcess", label: "In Process" },
                  { id: "inShipping", label: "In Shipping" },
                  { id: "delivered", label: "Delivered" },
                  { id: "rejected", label: "Rejected" },
                ],
              },
              {
                label: "Return Status (optional override)",
                name: "returnStatus",
                componentType: "select",
                options: [
                  { id: "", label: "None" },
                  { id: "REFUND_APPROVED", label: "Refund initiated" },
                  { id: "PICKUP_SCHEDULED", label: "Pickup scheduled" },
                  { id: "PICKED_UP", label: "Item picked up" },
                  { id: "IN_TRANSIT", label: "Return in transit" },
                  { id: "RECEIVED", label: "Item received" },
                  { id: "REFUND_COMPLETED", label: "Refund completed" },
                  { id: "RETURN_CANCELLED", label: "Return cancelled" },
                ],
              },
            ]}
            formData={formData}
            setFormData={setFormData}
            buttonText={"Update Order"}
            onSubmit={handleUpdateStatus}
          />
        </div>
      </div>
    </DialogContent>
  );
}

AdminOrderDetailsView.propTypes = {
  orderDetails: PropTypes.shape({
    _id: PropTypes.string,
    orderDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    totalAmount: PropTypes.number,
    adminVisibleTotalAmount: PropTypes.number,
    adminVisibleItemCount: PropTypes.number,
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
  }),
};

export default AdminOrderDetailsView;