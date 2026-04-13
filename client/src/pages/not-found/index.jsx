import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-secondary mb-6">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-7xl font-bold text-gradient mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate("/shop/home")}
          className="rounded-full px-6 h-11 bg-gradient hover:opacity-90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
