import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function UnauthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10 mb-6">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          You don't have permission to view this page. Please sign in with the correct account.
        </p>
        <Button
          onClick={() => navigate("/auth/login")}
          className="rounded-full px-6 h-11"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Login
        </Button>
      </div>
    </div>
  );
}

export default UnauthPage;
