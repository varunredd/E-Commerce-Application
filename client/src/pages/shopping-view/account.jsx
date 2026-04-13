import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Address from "@/components/shopping-view/address";
import ShoppingOrders from "@/components/shopping-view/orders";
import { Package, MapPin, UserCircle } from "lucide-react";
import { useSelector } from "react-redux";

function ShoppingAccount() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex flex-col min-h-[70vh]">
      {/* Header banner */}
      <div className="relative h-[200px] w-full overflow-hidden bg-gradient">
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-screen-2xl mx-auto px-6 w-full">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.userName?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.userName}</h1>
                <p className="text-white/70 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto w-full px-4 md:px-6 py-8 -mt-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
          <Tabs defaultValue="orders">
            <TabsList className="bg-secondary/50 rounded-full p-1">
              <TabsTrigger
                value="orders"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 gap-2"
              >
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="address"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm px-5 gap-2"
              >
                <MapPin className="h-4 w-4" />
                Addresses
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-6">
              <ShoppingOrders />
            </TabsContent>
            <TabsContent value="address" className="mt-6">
              <Address />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;
