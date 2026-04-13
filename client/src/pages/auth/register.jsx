import CommonForm from "@/components/common/form";
import { registerFormControls } from "@/config";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerUser } from "@/store/auth-slice";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";

const initialState = {
  userName: "",
  email: "",
  password: "",
};

function AuthRegister() {
  const [formData, setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  function onSubmit(event) {
    event.preventDefault();
    dispatch(registerUser(formData)).then((data) => {
      if (data?.payload?.success) {
        toast({ title: data?.payload?.message });
        navigate("/auth/login");
      } else {
        toast({ title: data?.payload?.message, variant: "destructive" });
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 lg:hidden justify-center mb-4">
        <div className="h-9 w-9 rounded-lg bg-gradient flex items-center justify-center">
          <Store className="h-4 w-4 text-white" />
        </div>
        <span className="text-xl font-bold">
          Nova<span className="text-gradient">Shop</span>
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            to="/auth/login"
          >
            Sign in
          </Link>
        </p>
      </div>

      <CommonForm
        formControls={registerFormControls}
        buttonText="Create Account"
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
      />

      <p className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default AuthRegister;
