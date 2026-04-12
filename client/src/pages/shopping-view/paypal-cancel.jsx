import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

function PaypalCancelPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    sessionStorage.removeItem("currentOrderId");

    toast({
      title: "Payment was cancelled",
      description: "Your cart is still saved. You can try again.",
      variant: "destructive",
    });

    navigate("/shop/checkout");
  }, [navigate, toast]);

  return null;
}

export default PaypalCancelPage;