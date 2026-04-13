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

const initialFormData = {
  status: "",
};

function AdminOrderDetailsView({ orderDetails }) {
  const [formData, setFormData] = useState(initialFormData);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    if (orderDetails?.orderStatus) {
      setFormData({ status: orderDetails.orderStatus });
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
    const { status } = formData;

    if (!status || !orderDetails?._id) return;

    dispatch(
      updateOrderStatus({ id: orderDetails._id, orderStatus: status })
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
            <Label>
              <Badge
                className={`py-1 px-3 ${
                  orderDetails?.orderStatus === "confirmed"
                    ? "bg-green-500"
                    : orderDetails?.orderStatus === "rejected"
                    ? "bg-red-600"
                    : orderDetails?.orderStatus === "inShipping"
                    ? "bg-blue-600"
                    : "bg-black"
                }`}
              >
                {orderDetails?.orderStatus || "-"}
              </Badge>
            </Label>
          </div>
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
            ]}
            formData={formData}
            setFormData={setFormData}
            buttonText={"Update Order Status"}
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