import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getSearchResults, resetSearchResults } from "@/store/shop/search-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useToast } from "@/components/ui/use-toast";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { fetchProductDetails } from "@/store/shop/product-slice";
import ProductDetailsDialog from "@/components/shopping-view/product-details";
import { Search, SearchX } from "lucide-react";

function SearchProducts() {
  const [keyword, setKeyword] = useState("");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { searchResults, isLoading } = useSelector((state) => state.shopSearch);
  const { productDetails } = useSelector((state) => state.shopProducts);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();

  useEffect(() => {
    const q = searchParams.get("keyword");
    if (q) {
      setKeyword(q);
      dispatch(getSearchResults(q));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword.trim().length >= 2) {
        setSearchParams({ keyword: keyword.trim() });
        dispatch(getSearchResults(keyword.trim()));
      } else {
        dispatch(resetSearchResults());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  function handleAddtoCart(getCurrentProductId, getTotalStock) {
    let getCartItems = cartItems.items || [];
    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    dispatch(
      addToCart({ userId: user?.id, productId: getCurrentProductId, quantity: 1 })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({ title: "Added to cart!" });
      }
    });
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">
      {/* Search input */}
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-center mb-6">Search Products</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search for products, brands, categories..."
            className="pl-12 h-13 text-base rounded-full border-2 focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        </div>
        {keyword.trim().length > 0 && (
          <p className="text-sm text-muted-foreground mt-3 text-center">
            {searchResults?.length || 0} results for "{keyword.trim()}"
          </p>
        )}
      </div>

      {/* Results */}
      {searchResults && searchResults.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {searchResults.map((item) => (
            <ShoppingProductTile
              key={item._id}
              product={item}
              handleGetProductDetails={handleGetProductDetails}
              handleAddtoCart={handleAddtoCart}
            />
          ))}
        </div>
      ) : keyword.trim().length >= 2 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No results found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try different keywords or browse our categories.
          </p>
        </div>
      ) : keyword.trim().length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Start typing to search</h3>
          <p className="text-sm text-muted-foreground">
            Find products by name, brand, or category.
          </p>
        </div>
      ) : null}

      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default SearchProducts;
