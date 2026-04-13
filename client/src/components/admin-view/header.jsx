import { AlignJustify, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { logoutUser } from "@/store/auth-slice";
import { Avatar, AvatarFallback } from "../ui/avatar";

function AdminHeader({ setOpen }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  function handleLogout() {
    dispatch(logoutUser());
  }

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-card/80 backdrop-blur-lg border-b sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="lg:hidden h-9 w-9 rounded-full"
      >
        <AlignJustify className="h-[18px] w-[18px]" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold">{user?.userName}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient text-white text-xs font-bold">
            {user?.userName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </header>
  );
}

AdminHeader.propTypes = { setOpen: PropTypes.func };

export default AdminHeader;
