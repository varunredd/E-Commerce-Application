import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Store, ArrowLeft, Mail } from "lucide-react";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      if (res.data?.success) {
        setSent(true);
      }
    } catch {
      toast({
        title: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6 animate-fade-in text-center">
        <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
          <Mail className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account with that email exists, we've sent a password reset link.
          Please check your inbox and spam folder.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
      <div className="flex items-center gap-2.5 lg:hidden justify-center mb-4">
        <div className="h-9 w-9 rounded-lg bg-gradient flex items-center justify-center">
          <Store className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold">
          Nova<span className="text-gradient">Shop</span>
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-sm text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
