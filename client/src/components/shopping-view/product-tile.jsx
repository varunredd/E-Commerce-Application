import { Button } from "../ui/button";
import { brandOptionsMap, categoryOptionsMap } from "@/config";
import { ShoppingBag, Star } from "lucide-react";
import PropTypes from "prop-types";

function ShoppingProductTile({ product, handleGetProductDetails, handleAddtoCart }) {
  const hasDiscount = product?.salePrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover-lift">
      {/* Image */}
      <div
        onClick={() => handleGetProductDetails(product?._id)}
        className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-secondary/30"
      >
        <img
          src={product?.image}
          alt={product?.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product?.totalStock === 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-gray-900/80 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide">
              Sold Out
            </span>
          ) : product?.totalStock < 10 ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide">
              Only {product?.totalStock} left
            </span>
          ) : null}
          {hasDiscount && product?.totalStock > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-gradient text-white text-[10px] font-semibold uppercase tracking-wide">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick add button — appears on hover */}
        {product?.totalStock > 0 && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAddtoCart(product?._id, product?.totalStock);
              }}
              className="w-full h-10 rounded-xl bg-foreground/90 hover:bg-foreground text-background font-medium text-sm backdrop-blur-sm"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {brandOptionsMap[product?.brand]}
          </span>
          <span className="text-muted-foreground/30 text-[11px]">·</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {categoryOptionsMap[product?.category]}
          </span>
        </div>

        <h3
          onClick={() => handleGetProductDetails(product?._id)}
          className="font-semibold text-sm leading-snug mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-2"
        >
          {product?.title}
        </h3>

        {/* Rating placeholder */}
        {product?.averageReview > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{product.averageReview.toFixed(1)}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold">
                ${product?.salePrice?.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${product?.price?.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold">
              ${product?.price?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

ShoppingProductTile.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string,
    image: PropTypes.string,
    title: PropTypes.string,
    totalStock: PropTypes.number,
    salePrice: PropTypes.number,
    price: PropTypes.number,
    category: PropTypes.string,
    brand: PropTypes.string,
    averageReview: PropTypes.number,
  }),
  handleGetProductDetails: PropTypes.func,
  handleAddtoCart: PropTypes.func,
};

export default ShoppingProductTile;
