import { Link } from "react-router-dom";
import pinkBag from "./assets/pinkBag.png";
import binIcon from "./assets/Bin.svg";


function HeroSection() {
    return (
        <section className="w-full bg-[#f3f3f1]">
            <div className="w-full max-w-[1512px] mx-auto px-[36px] pt-[32px] pb-[40px] flex justify-between gap-[30px]">
                <div className="w-[58%] pt-[44px]">
                    <h1
                        className="m-0 text-black text-[180px] leading-[0.78] tracking-[0.03em]"
                        style={{ fontFamily: "Dorsa, sans-serif" }}
                    >
                        HANDMADE-IS A FUTURE
                    </h1>

                    <div className="w-full max-w-[790px] h-[7px] bg-black mt-[14px]"></div>

                    <div className="w-full max-w-[790px] flex flex-col items-center">
                        <p className="mt-[14px] mb-0 text-black text-[74px] leading-none">
                            BY DARIN’S
                        </p>

                        <div className="w-[185px] h-[5px] bg-black mt-[10px]"></div>
                    </div>

                    <Link
                        to="/catalog"
                        className="inline-flex w-[330px] h-[76px] mt-[54px] ml-[250px] items-center justify-center rounded-full bg-[#140000] text-white text-[34px] tracking-[0.18em] no-underline cursor-pointer"
                    >
                        CATALOG
                    </Link>
                </div>

                <div className="w-[42%] relative flex justify-center items-start min-h-[580px]">
                    <button
                        type="button"
                        aria-label="Cart"
                        className="absolute top-[10px] right-[8px] cursor-pointer"
                        style={{ all: "unset", position: "absolute", top: "10px", right: "8px", cursor: "pointer" }}
                    >
                        <img
                            src={binIcon}
                            alt="Cart"
                            className="block w-[28px] h-[28px]"
                        />
                    </button>







                    <img
                        src={pinkBag}
                        alt="Pink handmade bag"
                        className="w-full max-w-[540px] mt-[44px] object-contain"
                    />
                </div>
            </div>
        </section>
    );
}

export default HeroSection;