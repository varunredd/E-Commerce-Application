import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your order. We'll send you a confirmation email shortly with your order details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/shop/account")}
            className="bg-gradient hover:opacity-90 rounded-full px-6 h-11"
          >
            <Package className="mr-2 h-4 w-4" />
            View Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/shop/home")}
            className="rounded-full px-6 h-11"
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
