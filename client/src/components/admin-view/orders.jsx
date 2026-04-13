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
import AdminOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  resetOrderDetails,
} from "@/store/admin/order-slice";
import { Badge } from "../ui/badge";

function AdminOrdersView() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { orderList, orderDetails, isLoading } = useSelector(
    (state) => state.adminOrder
  );
  const dispatch = useDispatch();

  function handleFetchOrderDetails(orderId) {
    dispatch(getOrderDetailsForAdmin(orderId));
  }

  function handleDialogChange(open) {
    setOpenDetailsDialog(open);

    if (!open) {
      dispatch(resetOrderDetails());
    }
  }

  function getOrderAmount(orderItem) {
    if (typeof orderItem?.adminVisibleTotalAmount === "number") {
      return orderItem.adminVisibleTotalAmount;
    }

    if (Array.isArray(orderItem?.cartItems)) {
      return orderItem.cartItems.reduce((sum, item) => {
        const price = Number(item?.price) || 0;
        const quantity = Number(item?.quantity) || 0;
        return sum + price * quantity;
      }, 0);
    }

    return Number(orderItem?.totalAmount) || 0;
  }

  function getVisibleItemCount(orderItem) {
    if (typeof orderItem?.adminVisibleItemCount === "number") {
      return orderItem.adminVisibleItemCount;
    }

    return Array.isArray(orderItem?.cartItems) ? orderItem.cartItems.length : 0;
  }

  useEffect(() => {
    dispatch(getAllOrdersForAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (orderDetails !== null) {
      setOpenDetailsDialog(true);
    }
  }, [orderDetails]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Product Orders</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : orderList && orderList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>My Items</TableHead>
                <TableHead>My Amount</TableHead>
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

                  <TableCell>{getVisibleItemCount(orderItem)}</TableCell>

                  <TableCell>${getOrderAmount(orderItem).toFixed(2)}</TableCell>

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
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No orders found for your products.
          </div>
        )}

        <Dialog open={openDetailsDialog} onOpenChange={handleDialogChange}>
          <AdminOrderDetailsView orderDetails={orderDetails} />
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default AdminOrdersView;