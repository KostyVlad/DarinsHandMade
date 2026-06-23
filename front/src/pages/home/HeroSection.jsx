import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import pinkBag from "./assets/pinkBag.png";

function HeroSection({ onShopClick }) {
    const [shopHovered, setShopHovered] = useState(false);

    return (
        <section className="w-full bg-[#f3f3f1] overflow-hidden">
            <div className="w-full max-w-[1512px] mx-auto px-[20px] md:px-[36px] pt-[32px] pb-[40px] flex flex-col md:flex-row md:justify-between gap-[30px]">
                <div className="w-full md:w-[58%] pt-[44px]">
                    <motion.h1
                        className="m-0 text-black text-[64px] sm:text-[110px] md:text-[180px] leading-[0.78] tracking-[0.06em]"
                        style={{ fontFamily: "Dorsa, sans-serif" }}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        EXCLUSIVE HANDMADE
                    </motion.h1>

                    <motion.div
                        className="w-full max-w-[790px] h-[7px] bg-black mt-[14px]"
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />

                    <motion.div
                        className="w-full max-w-[790px] flex flex-col items-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <p className="mt-[17px] mb-0 text-black text-[40px] md:text-[74px] leading-none" style={{ fontFamily: "Dorsa, sans-serif" }}>
                            BY DARIN'S
                        </p>
                        <div className="w-[200px] md:w-[360px] h-[5px] bg-black mt-[10px]" />
                    </motion.div>

                    <motion.div
                        className="mt-[40px] md:mt-[54px] md:ml-[250px] flex flex-col sm:flex-row items-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <motion.button
                            type="button"
                            onClick={onShopClick}
                            onHoverStart={() => setShopHovered(true)}
                            onHoverEnd={() => setShopHovered(false)}
                            whileTap={{ scale: 0.96 }}
                            className="relative inline-flex w-full max-w-[330px] h-[76px] items-center justify-center rounded-full bg-[#140000] text-white text-[34px] tracking-[0.18em] cursor-pointer border-none overflow-hidden"
                            style={{ fontFamily: "Dorsa, sans-serif" }}
                        >
                            <motion.span
                                className="absolute inset-0 rounded-full bg-white/10"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={shopHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            />
                            <motion.span
                                className="relative z-10 flex items-center gap-3"
                                animate={shopHovered ? { letterSpacing: "0.28em" } : { letterSpacing: "0.18em" }}
                                transition={{ duration: 0.3 }}
                            >
                                SHOP
                                <motion.span
                                    animate={shopHovered ? { x: 6, opacity: 1 } : { x: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-[22px]"
                                >
                                    →
                                </motion.span>
                            </motion.span>
                        </motion.button>

                        <motion.div
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link
                                to="/custom-studio"
                                className="inline-flex h-[76px] px-8 items-center justify-center rounded-full border-2 border-[#140000] text-[#140000] text-[20px] tracking-[0.18em] no-underline hover:bg-[#140000] hover:text-white transition-colors duration-300"
                                style={{ fontFamily: "Perpetua Titling MT, serif" }}
                            >
                                CUSTOM
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                <motion.div
                    className="w-full md:w-[42%] flex items-center justify-center"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.img
                        src={pinkBag}
                        alt="Pink handmade bag"
                        className="w-full max-w-[540px] mt-[44px] object-contain"
                        whileHover={{ scale: 1.03, rotate: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </motion.div>
            </div>
        </section>
    );
}

export default HeroSection;
