import { NavLink } from "react-router-dom";
import { ShoppingBag, User } from "lucide-react";

function Header() {
  const baseClass =
    "text-[#f5efe8] no-underline text-[18px] tracking-[0.18em]";

  return (
    <header className="w-full h-[90px] bg-black flex items-center justify-center">

      <nav className="w-full max-w-[1512px] px-[42px] flex items-center justify-between">
        <NavLink to="/beaded-bags" className={baseClass}>
          BEADED BAGS
        </NavLink>

        <NavLink to="/about" className={baseClass}>
          ABOUT
        </NavLink>

        <NavLink to="/bracelets" className={baseClass}>
          BRACELETS
        </NavLink>

        <NavLink to="/" end className={baseClass}>
          HOME
        </NavLink>

        <NavLink to="/crochet-wear" className={baseClass}>
          EMBROIDERY
        </NavLink>

        <NavLink to="/custom-studio" className={baseClass}>
          CUSTOM STUDIO
        </NavLink>
      </nav>


      <div className="flex items-center gap-3 md:gap-4 lg:gap-5">
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

        <NavLink
          to="/cart"
          className="relative flex items-center gap-2 text-[#f5efe8] no-underline transition-opacity duration-300 hover:opacity-70"
          style={{ fontFamily: "Centaur, serif" }}
        >
          <div className="relative">
            <ShoppingBag size={30} strokeWidth={1.75} />
            <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f5efe8] px-[4px] text-[10px] text-black leading-none">
              0
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