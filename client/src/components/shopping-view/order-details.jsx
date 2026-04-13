import { useMemo } from "react";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { Badge } from "../ui/badge";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

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
            <p className="font-medium">Items</p>
            <Label>{itemCount}</Label>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="font-medium">Order Price</p>
            <Label>${Number(computedTotal || 0).toFixed(2)}</Label>
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
            <div className="font-medium">Order Details</div>

            <ul className="grid gap-3">
              {orderDetails?.cartItems && orderDetails?.cartItems.length > 0 ? (
                orderDetails.cartItems.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-md border p-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium">{item.title}</span>
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: ${Number(item.price || 0).toFixed(2)}</span>
                    </div>

                    {item?.ownerAdminName ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Seller: {item.ownerAdminName}
                      </div>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No items found in this order.
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
        ownerAdminName: PropTypes.string,
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

export default ShoppingOrderDetailsView;