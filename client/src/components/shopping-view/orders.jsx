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

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
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

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId(user.id));
    }
  }, [dispatch, user?.id]);

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
                  <TableHead>Order Status</TableHead>
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
                    <TableCell className="font-medium">
                      {orderItem?._id}
                    </TableCell>

                    <TableCell>
                      {orderItem?.orderDate
                        ? String(orderItem.orderDate).split("T")[0]
                        : "-"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={`py-1 px-3 ${
                          orderItem?.orderStatus === "confirmed"
                            ? "bg-green-500"
                            : orderItem?.orderStatus === "rejected"
                            ? "bg-red-600"
                            : orderItem?.orderStatus === "inShipping"
                            ? "bg-blue-600"
                            : "bg-black"
                        }`}
                      >
                        {orderItem?.orderStatus}
                      </Badge>
                    </TableCell>

                    <TableCell>{getOrderItemCount(orderItem)}</TableCell>

                    <TableCell>
                      ${Number(orderItem?.totalAmount || 0).toFixed(2)}
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