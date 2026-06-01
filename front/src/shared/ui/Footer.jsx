import { NavLink } from "react-router-dom";

function Footer() {
    const sectionTitleClass =
        "text-[#f5efe8] text-[32px] tracking-[4px] leading-none m-0";

    const footerLinkClass =
        "text-[#ccc] text-[20px] tracking-[2.88px] leading-relaxed no-underline m-0";

    return (
        <footer className="w-full bg-black px-[100px] pt-[34px] pb-[34px]">
            <div className="mx-auto w-full">
                <div className="grid grid-cols-4 gap-[130px]">
                    <div>
                        <h3
                            className="text-[48px] tracking-[8.64px] leading-none text-[#f5efe8] m-0"
                            style={{ fontFamily: "Dorsa, sans-serif" }}
                        >
                            DARIN'S
                        </h3>

                        <p
                            className="text-[#ccc] text-[20px] tracking-[2.88px] leading-relaxed m-0 mt-[24px]"
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

                        <div className="mt-[28px] flex flex-col gap-[16px]">
                            <NavLink
                                to="/beaded-bags"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Beaded Bags
                            </NavLink>

                            <NavLink
                                to="/bracelets"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Bracelets
                            </NavLink>

                            <NavLink
                                to="/crochet-wear"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Embroidery
                            </NavLink>

                            <NavLink
                                to="/custom-studio"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Custom Studio
                            </NavLink>
                        </div>
                    </div>

                    <div>
                        <h3
                            className={sectionTitleClass}
                            style={{ fontFamily: "Cormorant Garamond, serif" }}
                        >
                            INFORMATION
                        </h3>

                        <div className="mt-[28px] flex flex-col gap-[16px]">
                            <NavLink
                                to="/about"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                About Us
                            </NavLink>

                            <NavLink
                                to="/shipping&returns"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Shipping & Returns
                            </NavLink>

                            <NavLink
                                to="/care-instructions"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Care Instructions
                            </NavLink>

                            <NavLink
                                to="/contact"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Contact
                            </NavLink>
                        </div>
                    </div>

                    <div>
                        <h3
                            className={sectionTitleClass}
                            style={{ fontFamily: "Cormorant Garamond, serif" }}
                        >
                            FOLLOW US
                        </h3>

                        <div className="mt-[28px] flex flex-col gap-[16px]">
                            <a
                                href="https://www.instagram.com/darins.handmade/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Instagram
                            </a>

                            <a
                                href="https://www.etsy.com/shop/DarinaArtCraft?ref=dashboard-header"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Etsy
                            </a>

                            <a
                                href="https://facebook.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                Facebook
                            </a>

                            <a
                                href="https://tiktok.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={footerLinkClass}
                                style={{ fontFamily: "Centaur, serif" }}
                            >
                                TikTok
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-[58px] h-px w-full bg-[#2a2a2a]" />

                <div className="mt-[32px] flex items-center justify-between">
                    <p
                        className="m-0 text-[#ccc] text-[20px] tracking-[2.88px] leading-relaxed"
                        style={{ fontFamily: "Centaur, serif" }}
                    >
                        © 2026 Darin's Handmade. All rights reserved.
                    </p>

                    <div className="flex items-center gap-[42px]">
                        <NavLink
                            to="/privacy-policy"
                            className={footerLinkClass}
                            style={{ fontFamily: "Centaur, serif" }}
                        >
                            Privacy Policy
                        </NavLink>

                        <NavLink
                            to="/terms-of-service"
                            className={footerLinkClass}
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