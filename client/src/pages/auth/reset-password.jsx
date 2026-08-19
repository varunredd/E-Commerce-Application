import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Store, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/reset-password", {
        token,
        password,
      });
      if (res.data?.success) {
        setSuccess(true);
      } else {
        toast({
          title: res.data?.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title:
          err.response?.data?.message ||
          "Something went wrong. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6 animate-fade-in text-center">
        <h1 className="text-2xl font-bold">Invalid Link</h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-6 animate-fade-in text-center">
        <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Password Reset!</h1>
        <p className="text-sm text-muted-foreground">
          Your password has been updated. You can now log in with your new
          password.
        </p>
        <Link to="/auth/login">
          <Button className="w-full mt-2">Go to Login</Button>
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
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Must be at least 8 characters with uppercase, lowercase, and a number.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
