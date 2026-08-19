import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import ShoppingOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersByUserId,
  getOrderDetails,
  resetOrderDetails,
} from "@/store/shop/order-slice";
import { Badge } from "../ui/badge";
import {
  getOrderStatusBadgeClass,
  getReturnStatusBadgeClass,
  getReturnStatusLabel,
} from "@/lib/return-status";

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const dispatch = useDispatch();
  const { orderList, orderDetails, isLoading } = useSelector(
    (state) => state.shopOrder
  );

  function handleFetchOrderDetails(orderId) {
    dispatch(getOrderDetails(orderId));
  }

  function handleDialogChange(open) {
    setOpenDetailsDialog(open);

    if (!open) {
      dispatch(resetOrderDetails());
    }
  }

  function getOrderItemCount(orderItem) {
    return Array.isArray(orderItem?.cartItems) ? orderItem.cartItems.length : 0;
  }

  function renderStatus(orderItem) {
    if (orderItem?.returnStatus) {
      return (
        <Badge
          className={`py-1 px-3 ${getReturnStatusBadgeClass(orderItem.returnStatus)}`}
        >
          {getReturnStatusLabel(orderItem.returnStatus)}
        </Badge>
      );
    }

    return (
      <Badge
        className={`py-1 px-3 ${getOrderStatusBadgeClass(orderItem?.orderStatus)}`}
      >
        {orderItem?.orderStatus}
      </Badge>
    );
  }

  useEffect(() => {
    dispatch(getAllOrdersByUserId());
  }, [dispatch]);

  useEffect(() => {
    if (orderDetails !== null) {
      setOpenDetailsDialog(true);
    }
  }, [orderDetails]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : orderList && orderList.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Order Price</TableHead>
                  <TableHead>
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orderList.map((orderItem) => (
                  <TableRow key={orderItem?._id}>
                    <TableCell className="font-medium font-mono text-xs">
                      #{String(orderItem?._id || "").slice(-8).toUpperCase()}
                    </TableCell>

                    <TableCell>
                      {orderItem?.orderDate
                        ? String(orderItem.orderDate).split("T")[0]
                        : "-"}
                    </TableCell>

                    <TableCell>{renderStatus(orderItem)}</TableCell>

                    <TableCell>{getOrderItemCount(orderItem)}</TableCell>

                    <TableCell>
                      <div>
                        ${Number(orderItem?.totalAmount || 0).toFixed(2)}
                        {Number(orderItem?.refundedAmount || 0) > 0 && (
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Refunded ${Number(orderItem.refundedAmount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        onClick={() => handleFetchOrderDetails(orderItem?._id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={openDetailsDialog} onOpenChange={handleDialogChange}>
              <ShoppingOrderDetailsView orderDetails={orderDetails} />
            </Dialog>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No orders found yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ShoppingOrders;
