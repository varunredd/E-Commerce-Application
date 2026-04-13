import { Outlet } from "react-router-dom";
import { Store } from "lucide-react";

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden bg-gradient">
        {/* Decorative shapes */}
        <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-md space-y-6 text-center px-12">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">NovaShop</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your Style,
            <br />
            Your Story.
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Join thousands of fashion enthusiasts who trust NovaShop for the latest trends and timeless classics.
          </p>
          <div className="flex items-center justify-center gap-8 pt-4">
            {[
              { num: "10K+", label: "Products" },
              { num: "50K+", label: "Customers" },
              { num: "4.9", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.num}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form area */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
