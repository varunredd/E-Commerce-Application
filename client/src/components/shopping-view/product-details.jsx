import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { setProductDetails } from "@/store/shop/product-slice";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { addReview, getReviews } from "@/store/shop/review-slice";
import {
  ShoppingBag,
  MessageSquare,
  Send,
  Store,
  ShieldCheck,
} from "lucide-react";
import { brandOptionsMap, categoryOptionsMap } from "@/config";

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);
  const { toast } = useToast();

  function handleRatingChange(getRating) {
    setRating(getRating);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock) {
    let getCartItems = cartItems.items || [];

    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );

      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;

        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({ title: "Added to cart!" });
      }
    });
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
  }

  function handleAddReview() {
    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload && data.payload.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({ title: "Review added!" });
      } else {
        toast({ title: "Failed to add review", variant: "destructive" });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) {
      dispatch(getReviews(productDetails?._id));
    }
  }, [productDetails, dispatch]);

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.reviewValue, 0) / reviews.length
      : 0;

  const hasDiscount = productDetails?.salePrice > 0;

  const discountPercent =
    hasDiscount && productDetails?.price
      ? Math.round(
          ((productDetails.price - productDetails.salePrice) /
            productDetails.price) *
            100
        )
      : 0;

  const sellerName =
    productDetails?.ownerAdminName ||
    productDetails?.ownerName ||
    productDetails?.sellerName ||
    "";

  const sellerEmail =
    productDetails?.ownerAdminEmail || productDetails?.ownerEmail || "";

  const showSellerInfo = Boolean(sellerName || sellerEmail);

  const displayPrice = useMemo(() => {
    if (hasDiscount) return Number(productDetails?.salePrice || 0).toFixed(2);
    return Number(productDetails?.price || 0).toFixed(2);
  }, [hasDiscount, productDetails]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid max-w-[95vw] grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 md:max-w-[900px] md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square bg-secondary/30 md:min-h-[500px] md:aspect-auto">
          <img
            src={productDetails?.image}
            alt={productDetails?.title}
            className="h-full w-full object-cover"
          />

          {hasDiscount && (
            <span className="absolute left-4 top-4 rounded-full bg-gradient px-3 py-1.5 text-xs font-bold text-white">
              -{discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex max-h-[80vh] flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex-1">
            {/* Meta */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {brandOptionsMap[productDetails?.brand]}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {categoryOptionsMap[productDetails?.category]}
              </span>
            </div>

            <h1 className="mb-3 text-2xl font-bold leading-tight">
              {productDetails?.title}
            </h1>

            {/* Owner / Seller */}
            {showSellerInfo && (
              <div className="mb-5 rounded-xl border border-border/50 bg-secondary/30 p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    <Store className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Sold by</span>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-xs"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Verified Seller
                      </Badge>
                    </div>

                    {sellerName ? (
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {sellerName}
                      </p>
                    ) : null}

                    {sellerEmail ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sellerEmail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <StarRatingComponent rating={averageReview} />
              </div>
              <span className="text-sm text-muted-foreground">
                {averageReview.toFixed(1)} ({reviews?.length || 0}{" "}
                {reviews?.length === 1 ? "review" : "reviews"})
              </span>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {productDetails?.description}
            </p>

            {/* Price */}
            <div className="mb-6 flex items-baseline gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-bold">${displayPrice}</span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${Number(productDetails?.price || 0).toFixed(2)}
                  </span>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-sm font-semibold text-green-600">
                    Save $
                    {Number(
                      (productDetails?.price || 0) -
                        (productDetails?.salePrice || 0)
                    ).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold">${displayPrice}</span>
              )}
            </div>

            {/* Stock info */}
            {productDetails?.totalStock > 0 && productDetails?.totalStock < 10 && (
              <p className="mb-4 text-sm font-medium text-amber-600">
                Only {productDetails.totalStock} left in stock
              </p>
            )}

            {/* Add to cart */}
            <div className="mb-8">
              {productDetails?.totalStock === 0 ? (
                <Button
                  className="h-12 w-full cursor-not-allowed rounded-xl opacity-60"
                  disabled
                >
                  Out of Stock
                </Button>
              ) : (
                <Button
                  className="h-12 w-full rounded-xl bg-gradient text-base font-semibold text-white hover:opacity-90"
                  onClick={() =>
                    handleAddToCart(
                      productDetails?._id,
                      productDetails?.totalStock
                    )
                  }
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Reviews */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <MessageSquare className="h-5 w-5" />
                Reviews
              </h2>

              {reviews && reviews.length > 0 ? (
                <div className="mb-6 max-h-[200px] space-y-4 overflow-y-auto pr-1">
                  {reviews.map((reviewItem) => (
                    <div
                      key={reviewItem._id}
                      className="flex gap-3 rounded-xl bg-secondary/50 p-3"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {reviewItem?.userName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {reviewItem?.userName}
                          </span>
                        </div>

                        <div className="mb-1 flex items-center gap-0.5">
                          <StarRatingComponent rating={reviewItem?.reviewValue} />
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {reviewItem.reviewMessage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-6 text-sm text-muted-foreground">
                  No reviews yet. Be the first!
                </p>
              )}

              {/* Write review */}
              <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
                <p className="text-sm font-medium">Write a review</p>

                <div className="flex gap-1">
                  <StarRatingComponent
                    rating={rating}
                    handleRatingChange={handleRatingChange}
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    name="reviewMsg"
                    value={reviewMsg}
                    onChange={(e) => setReviewMsg(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 rounded-lg bg-background"
                  />

                  <Button
                    onClick={handleAddReview}
                    disabled={reviewMsg.trim() === "" || rating === 0}
                    size="icon"
                    className="h-10 w-10 rounded-lg bg-gradient hover:opacity-90"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

ProductDetailsDialog.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  productDetails: PropTypes.shape({
    _id: PropTypes.string,
    image: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    salePrice: PropTypes.number,
    totalStock: PropTypes.number,
    brand: PropTypes.string,
    category: PropTypes.string,
    ownerAdminName: PropTypes.string,
    ownerName: PropTypes.string,
    sellerName: PropTypes.string,
    ownerAdminEmail: PropTypes.string,
    ownerEmail: PropTypes.string,
  }),
};

export default ProductDetailsDialog;