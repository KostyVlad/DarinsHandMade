import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, Menu, X } from "lucide-react";
import { useCart } from "../../context/CartContext";

function Header({ token, setToken, setUser, user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { getTotalItems } = useCart();

  const baseClass =
    "text-[#f5efe8] no-underline text-[18px] tracking-[0.18em]";

  const isManager = user?.role === "manager" || user?.role === "admin";

  const links = [
    { to: "/beaded-bags", label: "BEADED BAGS" },
    { to: "/about", label: "ABOUT" },
    { to: "/", label: "HOME", end: true },
    { to: "/bracelets", label: "BRACELETS" },
    { to: "/custom-studio", label: "CUSTOM STUDIO" },
    ...(isManager ? [{ to: "/admin", label: "MANAGE" }] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser?.(null);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="w-full bg-black">
      <div className="w-full max-w-[1512px] mx-auto px-[20px] md:px-[42px] h-[90px] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-[#f5efe8] bg-transparent border-none cursor-pointer p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <nav className="hidden md:flex md:flex-1 items-center justify-between gap-4 md:mr-8 lg:mr-12">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={baseClass}>
              {l.label}
            </NavLink>
          ))}
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
      </div>

      {menuOpen && (
        <nav className="md:hidden flex flex-col bg-black border-t border-white/10 px-[20px] pb-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMenuOpen(false)}
              className={`${baseClass} py-4 border-b border-white/5`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

export default Header;
