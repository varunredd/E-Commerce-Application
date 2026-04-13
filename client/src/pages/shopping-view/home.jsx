import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronLeftIcon,
  ChevronRightIcon,
  Footprints,
  Gem,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllFilteredProducts,
  fetchProductDetails,
} from "@/store/shop/product-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useNavigate } from "react-router-dom";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";
import ProductDetailsDialog from "@/components/shopping-view/product-details";
import { getFeatureImages } from "@/store/common-slice";

const categoriesWithIcon = [
  { id: "men", label: "Men", icon: Users, color: "from-blue-500 to-blue-600", desc: "Latest trends" },
  { id: "women", label: "Women", icon: Sparkles, color: "from-pink-500 to-rose-500", desc: "New arrivals" },
  { id: "kids", label: "Kids", icon: Zap, color: "from-amber-400 to-orange-500", desc: "Fun styles" },
  { id: "accessories", label: "Accessories", icon: Gem, color: "from-violet-500 to-purple-600", desc: "Must-haves" },
  { id: "footwear", label: "Footwear", icon: Footprints, color: "from-emerald-500 to-teal-600", desc: "Step up" },
];

const brandsWithIcon = [
  { id: "nike", label: "Nike" },
  { id: "adidas", label: "Adidas" },
  { id: "puma", label: "Puma" },
  { id: "levi", label: "Levi's" },
  { id: "zara", label: "Zara" },
  { id: "h&m", label: "H&M" },
];

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { productList, productDetails } = useSelector(
    (state) => state.shopProducts
  );
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem("filters");
    const currentFilter = { [section]: [getCurrentItem.id] };
    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  function handleAddtoCart(getCurrentProductId) {
    dispatch(
      addToCart({ userId: user?.id, productId: getCurrentProductId, quantity: 1 })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({ title: "Added to cart!" });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (featureImageList?.length || 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [featureImageList]);

  useEffect(() => {
    dispatch(fetchAllFilteredProducts({ filterParams: {}, sortParams: "price-lowtohigh" }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  const featuredProducts = productList?.slice(0, 8) || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ══ HERO BANNER ══ */}
      <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
        {featureImageList && featureImageList.length > 0
          ? featureImageList.map((slide, index) => (
              <img
                src={slide?.image}
                key={index}
                className={`${
                  index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                } absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out`}
              />
            ))
          : null}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12 w-full">
            <div className="max-w-lg animate-slide-up">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium mb-4">
                <Sparkles className="h-3 w-3" />
                New Season Collection
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
                Discover Your
                <br />
                <span className="text-gradient">Perfect Style</span>
              </h1>
              <p className="text-white/70 text-base md:text-lg mb-8 max-w-md">
                Curated fashion from the world's best brands. Free shipping on orders over $50.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/shop/listing")}
                  className="bg-gradient hover:opacity-90 text-white px-6 h-11 rounded-full font-semibold"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/shop/listing")}
                  className="border-white/30 text-white hover:bg-white/10 px-6 h-11 rounded-full bg-transparent"
                >
                  Browse All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        {featureImageList && featureImageList.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {featureImageList.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Nav arrows */}
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev - 1 + (featureImageList?.length || 1)) % (featureImageList?.length || 1))
          }
          className="absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % (featureImageList?.length || 1))
          }
          className="absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ══ CATEGORIES ══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Find exactly what you're looking for
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoriesWithIcon.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleNavigateToListingPage(item, "category")}
                className="group relative overflow-hidden rounded-2xl p-6 bg-secondary/50 hover:bg-secondary transition-all duration-300 hover-lift text-left"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-4`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-0.5">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                <ArrowRight className="absolute bottom-6 right-6 h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BRANDS ══ */}
      <section className="py-12 border-y bg-secondary/30">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
            {brandsWithIcon.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleNavigateToListingPage(brand, "brand")}
                className="text-xl md:text-2xl font-bold text-muted-foreground/40 hover:text-foreground transition-colors duration-300 tracking-tight"
              >
                {brand.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PRODUCTS ══ */}
      <section className="py-16 md:py-20">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Hand-picked for you
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/shop/listing")}
              className="hidden md:flex items-center gap-1 text-sm font-medium"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((productItem, idx) => (
              <div
                key={productItem._id}
                className="animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <ShoppingProductTile
                  handleGetProductDetails={handleGetProductDetails}
                  product={productItem}
                  handleAddtoCart={handleAddtoCart}
                />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/shop/listing")}
              className="rounded-full px-8"
            >
              View all products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══ PROMO BANNER ══ */}
      <section className="py-16 md:py-20 bg-gradient">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get 20% Off Your First Order
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Join thousands of happy customers. Sign up for exclusive deals and early access to new collections.
          </p>
          <div className="flex gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-12 px-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
            />
            <Button className="h-12 px-6 rounded-full bg-white text-primary font-semibold hover:bg-white/90">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* ══ TRUST BADGES ══ */}
      <section className="py-12 border-t">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: ShoppingBag, title: "Free Shipping", desc: "On orders over $50" },
              { icon: Star, title: "Top Quality", desc: "Authentic products only" },
              { icon: Zap, title: "Fast Delivery", desc: "2-5 business days" },
              { icon: Users, title: "24/7 Support", desc: "Always here to help" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingHome;
