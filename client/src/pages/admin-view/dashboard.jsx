import ProductImageUpload from "@/components/admin-view/image-upload";
import { Button } from "@/components/ui/button";
import { addFeatureImage, getFeatureImages, deleteFeatureImage } from "@/store/common-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { Package, ShoppingCart, Users, TrendingUp, ImagePlus, Trash2 } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 hover-lift">
      <div className="flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.role === "super_admin";

  function handleUploadFeatureImage() {
    dispatch(addFeatureImage(uploadedImageUrl)).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        setImageFile(null);
        setUploadedImageUrl("");
        toast({ title: "Banner uploaded successfully" });
      }
    });
  }

  function handleDeleteBanner(id) {
    dispatch(deleteFeatureImage(id)).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        toast({ title: "Banner deleted successfully" });
      }
    });
  }

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Products" value="25" color="bg-blue-500" />
        <StatCard icon={ShoppingCart} label="Total Orders" value="14" color="bg-gradient" />
        <StatCard icon={Users} label="Customers" value="3" color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Revenue" value="$1,247" color="bg-amber-500" />
      </div>

      {/* Banner management — super_admin only */}
      {isSuperAdmin && (
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <ImagePlus className="h-5 w-5 text-primary" />
            Hero Banner Management
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Upload images that appear in the homepage hero carousel.
          </p>

          <ProductImageUpload
            imageFile={imageFile}
            setImageFile={setImageFile}
            uploadedImageUrl={uploadedImageUrl}
            setUploadedImageUrl={setUploadedImageUrl}
            setImageLoadingState={setImageLoadingState}
            imageLoadingState={imageLoadingState}
            isCustomStyling={true}
          />
          <Button
            onClick={handleUploadFeatureImage}
            disabled={!uploadedImageUrl}
            className="mt-4 rounded-xl bg-gradient hover:opacity-90"
          >
            Upload Banner
          </Button>

          {/* Existing banners */}
          {featureImageList && featureImageList.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Current Banners ({featureImageList.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureImageList.map((item, idx) => (
                  <div key={item._id || idx} className="relative group rounded-xl overflow-hidden border border-border/50">
                    <img
                      src={item.image}
                      className="w-full h-[160px] object-cover"
                      alt={`Banner ${idx + 1}`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="absolute top-2 left-2 text-xs font-medium bg-black/50 text-white px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteBanner(item._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;