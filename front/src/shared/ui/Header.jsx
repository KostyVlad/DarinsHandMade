import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut } from "lucide-react";
import { useCart } from "../../context/CartContext";

function Header({ token, setToken }) {
  const navigate = useNavigate();


  const { getTotalItems } = useCart();

  const baseClass =
    "text-[#f5efe8] no-underline text-[18px] tracking-[0.18em]";

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/");
  };

  return (
    <header className="w-full h-[90px] bg-black flex items-center justify-center">
      <nav className="w-full max-w-[1512px] px-[42px] flex items-center justify-between">
        <NavLink to="/beaded-bags" className={baseClass}>
          BEADED BAGS
        </NavLink>

        <NavLink to="/about" className={baseClass}>
          ABOUT
        </NavLink>
        <NavLink to="/" end className={baseClass}>
          HOME
        </NavLink>
        <NavLink to="/bracelets" className={baseClass}>
          BRACELETS
        </NavLink>



        <NavLink to="/custom-studio" className={baseClass}>
          CUSTOM STUDIO
        </NavLink>
      </nav>

      <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
        {token ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70 cursor-pointer bg-transparent border-none"
            style={{ fontFamily: "Centaur, serif" }}
          >
            <LogOut size={28} strokeWidth={1.75} />
            <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
              Logout
            </span>
          </button>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70"
            style={{ fontFamily: "Centaur, serif" }}
          >
            <User size={30} strokeWidth={1.75} />
            <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
              Login
            </span>
          </NavLink>
        )}

        <NavLink
          to="/cart"
          className="relative flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70"
          style={{ fontFamily: "Centaur, serif" }}
        >
          <div className="relative">
            <ShoppingBag size={30} strokeWidth={1.75} />

            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f5efe8] px-[4px] text-[10px] text-black leading-none">
              {getTotalItems ? getTotalItems() : 0}
            </span>
          </div>

          <span className="hidden sm:inline text-[20px] tracking-[2px] leading-none">
            Cart
          </span>
        </NavLink>
      </div>
    </header>
  );
}

export default Header;