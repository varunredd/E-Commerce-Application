import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Button } from "../ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import UserCartItemsContent from "./cart-items-content";
import { ShoppingBag, ArrowRight } from "lucide-react";

function UserCartWrapper({ cartItems, setOpenCartSheet }) {
  const navigate = useNavigate();

  const totalCartAmount =
    cartItems && cartItems.length > 0
      ? cartItems.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  return (
    <SheetContent className="sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Your Cart
          {cartItems.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
            </span>
          )}
        </SheetTitle>
      </SheetHeader>

      {cartItems.length > 0 ? (
        <>
          <div className="flex-1 overflow-auto mt-6 space-y-4 pr-1">
            {cartItems.map((item, index) => (
              <UserCartItemsContent key={index} cartItem={item} />
            ))}
          </div>

          <div className="border-t pt-4 mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold">${totalCartAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>
            <Button
              onClick={() => {
                navigate("/shop/checkout");
                setOpenCartSheet(false);
              }}
              className="w-full h-11 rounded-xl bg-gradient hover:opacity-90 text-white font-semibold"
            >
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold mb-1">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start adding items to see them here.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigate("/shop/listing");
              setOpenCartSheet(false);
            }}
            className="rounded-full px-6"
          >
            Browse Products
          </Button>
        </div>
      )}
    </SheetContent>
  );
}

UserCartWrapper.propTypes = {
  cartItems: PropTypes.array.isRequired,
  setOpenCartSheet: PropTypes.func.isRequired,
};

export default UserCartWrapper;
