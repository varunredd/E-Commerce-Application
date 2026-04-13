import {
  BadgeCheck,
  LayoutDashboard,
  ShoppingBasket,
  Store,
} from "lucide-react";
import { Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

const adminSidebarMenuItems = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", path: "/admin/products", icon: ShoppingBasket },
  { id: "orders", label: "Orders", path: "/admin/orders", icon: BadgeCheck },
];

function MenuItems({ setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mt-6 flex-col flex gap-1">
      {adminSidebarMenuItems.map((menuItem) => {
        const isActive = location.pathname === menuItem.path;
        const Icon = menuItem.icon;
        return (
          <button
            key={menuItem.id}
            onClick={() => {
              navigate(menuItem.path);
              setOpen ? setOpen(false) : null;
            }}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-gradient text-white shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span>{menuItem.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

MenuItems.propTypes = { setOpen: PropTypes.func };

function AdminSideBar({ open, setOpen }) {
  const navigate = useNavigate();

  return (
    <Fragment>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-5">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Admin</span>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card p-5 lg:flex">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2.5 mb-2"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient flex items-center justify-center">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold">
            Nova<span className="text-gradient">Shop</span>
          </span>
        </button>
        <p className="text-xs text-muted-foreground ml-1 mb-4">Admin Panel</p>
        <MenuItems />
      </aside>
    </Fragment>
  );
}

AdminSideBar.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
};

export default AdminSideBar;
