import customBag from "./assets/customBagSection.png";
import { Link } from "react-router-dom";


function CustomBagSection() {
    return (
        <section className="w-full bg-black">
            <div className="mx-auto flex max-w-[1512px] items-center justify-between px-[50px] py-[40px]">
                <div className="w-[42%]">
                    <h2
                        className="m-0 text-white text-[150px] leading-[0.78] tracking-[0.18em]"
                        style={{ fontFamily: "Dorsa, sans-serif" }}
                    >
                        CREATE YOUR OWN DESIGN
                    </h2>

                    <p
                        className="mt-[50px] max-w-[560px] text-center text-white text-[32px] leading-[1.45] tracking-[0.12em]"
                        style={{ fontFamily: "Cormorant Garamond, serif" }}
                    >
                        "Choose the shape, color, and type of beads. Create a unique
                        accessory that fits you perfectly."
                    </p>

                    <Link
                        to="/custom-studio"
                        className="mt-[42px] inline-flex h-[76px] w-[320px] items-center justify-center rounded-full bg-white text-black text-[36px] tracking-[0.16em] no-underline cursor-pointer"
                        style={{ fontFamily: "Cormorant Garamond, serif" }}
                    >
                        CREATE
                    </Link>
                </div>

                <div className="flex w-[10%] flex-col items-center gap-[28px]">
                    <span className="h-[48px] w-[48px] rounded-full bg-[#ff00f5]"></span>
                    <span className="h-[48px] w-[48px] rounded-full bg-[#8f3dff]"></span>
                    <span className="h-[48px] w-[48px] rounded-full bg-[#4f3cff]"></span>
                    <span className="h-[48px] w-[48px] rounded-full bg-[#39c24a]"></span>
                </div>

                <div className="flex w-[38%] justify-end">
                    <img
                        src={customBag}
                        alt="Blue handmade beaded bag"
                        className="w-full max-w-[550px] object-contain"
                    />
                </div>
            </div>
        </section>
    );
}

export default CustomBagSection;