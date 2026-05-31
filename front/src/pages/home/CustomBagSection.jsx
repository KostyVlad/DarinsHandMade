import { useState } from "react";
import { Link } from "react-router-dom";

import skyBag from "./assets/skyCustomBagSection.png";
import blueBag from "./assets/blueCustomSectionbag.png";
import greenBag from "./assets/greenCustomSectionbag.png";
import pinkBag from "./assets/pinkCustomSectionbag.png";
import purpleBag from "./assets/purpleCustomSectionbag.png";

function CustomBagSection() {
    const bagOptions = [
        { color: "#25cfff", image: skyBag },
        { color: "#2d46ff", image: blueBag },
        { color: "#39c24a", image: greenBag },
        { color: "#ff00f5", image: pinkBag },
        { color: "#8d47ff", image: purpleBag },
    ];

    const [selectedBag, setSelectedBag] = useState(skyBag);

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
                        Choose the shape, color, and type of beads. Create a unique
                        accessory that fits you perfectly.
                    </p>

                    <Link
                        to="/custom-studio"
                        className="mt-[42px] inline-flex h-[76px] w-[320px] items-center justify-center rounded-full bg-white text-black text-[36px] tracking-[0.16em] no-underline cursor-pointer"
                        style={{ fontFamily: "Cormorant Garamond, serif" }}
                    >
                        CREATE
                    </Link>
                </div>

                <div className="flex w-[10%] flex-col items-center gap-[24px]">
                    {bagOptions.map((item, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedBag(item.image)}
                            className={`h-[48px] w-[48px] rounded-full cursor-pointer transition-all duration-300 ${selectedBag === item.image
                                ? "scale-110 border-4 border-white"
                                : "border-2 border-white/40"
                                }`}
                            style={{ backgroundColor: item.color }}
                            aria-label={`Select bag color ${index + 1}`}
                        />
                    ))}
                </div>

                <div className="flex w-[38%] justify-end">
                    <img
                        src={selectedBag}
                        alt="Handmade beaded bag"
                        className="w-full max-w-[470px] object-contain transition-all duration-300"
                    />
                </div>
            </div>
        </section>
    );
}

export default CustomBagSection;