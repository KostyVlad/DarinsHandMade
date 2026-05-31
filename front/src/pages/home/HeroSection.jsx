import { Link } from "react-router-dom";
import pinkBag from "./assets/pinkBag.png";
import binIcon from "./assets/Bin.svg";


function HeroSection({ onShopClick }) {
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

                    <button
                        type="button"
                        onClick={onShopClick}
                        className="inline-flex w-[330px] h-[76px] mt-[54px] ml-[250px] items-center justify-center rounded-full bg-[#140000] text-white text-[34px] tracking-[0.18em] no-underline cursor-pointer border-none"
                    >
                        SHOP
                    </button>
                </div>

                <div className="w-[42%] flex items-center justify-center">
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