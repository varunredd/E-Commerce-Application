import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api
      .post("/api/auth/verify-email", { token })
      .then((res) => {
        if (res.data?.success) {
          setStatus("success");
          setMessage(res.data.message);
        } else {
          setStatus("error");
          setMessage(res.data?.message || "Verification failed.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed. Link may be expired."
        );
      });
  }, [searchParams]);

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 animate-fade-in text-center">
      {status === "verifying" && <p className="text-sm">{message}</p>}
      {status === "success" && (
        <>
          <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Email Verified</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link to="/auth/login">
            <Button className="w-full">Sign in now</Button>
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link to="/auth/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default VerifyEmail;
