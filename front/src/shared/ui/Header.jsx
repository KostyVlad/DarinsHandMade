import { NavLink } from "react-router-dom";

function Header() {
  const baseClass =
    "text-[#f5efe8] no-underline text-[18px] tracking-[0.18em]";

  return (
    <header className="w-full h-[90px] bg-black flex items-center justify-center">
      <nav className="w-full max-w-[1512px] px-[42px] flex items-center justify-between">
        <NavLink to="/" end className={baseClass}>
          BEADED BAGS
        </NavLink>

        <NavLink to="/about" className={baseClass}>
          ABOUT
        </NavLink>

        <NavLink to="/catalog" className={baseClass}>
          BRACELETS
        </NavLink>

        <NavLink to="/" end className={baseClass}>
          HOME
        </NavLink>

        <NavLink to="/catalog" className={baseClass}>
          CROCHET
        </NavLink>

        <NavLink to="/custom-studio" className={baseClass}>
          CUSTOM STUDIO
        </NavLink>
      </nav>
    </header>
  );
}

export default Header;