import { NavLink } from "react-router-dom";

function Footer() {
    const sectionTitleClass =
        "text-[#f5efe8] text-[32px] tracking-[4px] leading-none m-0 mb-6";

    const footerLinkClass =
        "block text-[#ccc] text-[20px] tracking-[2.88px] leading-relaxed no-underline m-0 mb-4 hover:text-white transition-colors";

    return (
        <footer className="w-full bg-black px-[40px] lg:px-[100px] pt-[80px] pb-[40px]">
            <div className="mx-auto w-full max-w-[1512px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[60px] lg:gap-[130px]">

                    <div>
                        <h3
                            className="text-[48px] lg:text-[64px] tracking-[8.64px] leading-none text-[#f5efe8] m-0 mb-6"
                            style={{ fontFamily: "Dorsa, sans-serif" }}
                        >
                            DARIN'S
                        </h3>
                        <p
                            className="text-[#ccc] text-[20px] tracking-[2.88px] leading-relaxed m-0"
                            style={{ fontFamily: "Centaur, serif" }}
                        >
                            Handmade accessories crafted with love and attention to detail.
                        </p>
                    </div>

                    <div>
                        <h3
                            className={sectionTitleClass}
                            style={{ fontFamily: "Cormorant Garamond, serif" }}
                        >
                            SHOP
                        </h3>
                        <NavLink to="/beaded-bags" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Beaded Bags
                        </NavLink>
                        <NavLink to="/bracelets" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Bracelets
                        </NavLink>
                        <NavLink to="/custom-studio" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Custom Studio
                        </NavLink>
                    </div>

                    <div>
                        <h3
                            className={sectionTitleClass}
                            style={{ fontFamily: "Cormorant Garamond, serif" }}
                        >
                            INFO
                        </h3>
                        <NavLink to="/about" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            About Me
                        </NavLink>
                    </div>

                    <div>
                        <h3
                            className={sectionTitleClass}
                            style={{ fontFamily: "Cormorant Garamond, serif" }}
                        >
                            SOCIALS
                        </h3>
                        <a href="https://www.instagram.com/darins.handmade/" target="_blank" rel="noopener noreferrer" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Instagram
                        </a>
                        <a href="https://www.etsy.com/shop/DarinaArtCraft?ref=dashboard-header" target="_blank" rel="noopener noreferrer" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Etsy
                        </a>
                        <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            Facebook
                        </a>
                        <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className={footerLinkClass} style={{ fontFamily: "Centaur, serif" }}>
                            TikTok
                        </a>
                    </div>
                </div>

                <div className="mt-[80px] h-px w-full bg-[#2a2a2a]" />

                <div className="mt-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                    <p
                        className="m-0 text-[#ccc] text-[16px] lg:text-[20px] tracking-[2.88px] leading-relaxed"
                        style={{ fontFamily: "Centaur, serif" }}
                    >
                        © 2026 Darin's Handmade. All rights reserved.
                    </p>

                    <div className="flex items-center gap-[20px] lg:gap-[42px]">
                        <NavLink
                            to="/privacy-policy"
                            className="text-[#ccc] text-[16px] lg:text-[20px] tracking-[2.88px] leading-relaxed no-underline m-0 hover:text-white transition-colors"
                            style={{ fontFamily: "Centaur, serif" }}
                        >
                            Privacy Policy
                        </NavLink>

                        <NavLink
                            to="/terms-of-service"
                            className="text-[#ccc] text-[16px] lg:text-[20px] tracking-[2.88px] leading-relaxed no-underline m-0 hover:text-white transition-colors"
                            style={{ fontFamily: "Centaur, serif" }}
                        >
                            Terms of Service
                        </NavLink>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;