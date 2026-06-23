import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../api";

export default function BraceletsPage() {
    const [bracelets, setBracelets] = useState([]);
    const [loading, setLoading] = useState(true);

    const { items, addToCart } = useCart();

    useEffect(() => {
        const fetchBracelets = async () => {
            try {
                const res = await fetch(`${API}/api/products`);
                const data = await res.json();

                const braceletsOnly = (data.data || []).filter(
                    (product) => product.category === "bracelets"
                );

                setBracelets(braceletsOnly);
            } catch (err) {
                console.error("Error loading bracelets:", err);
                setBracelets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBracelets();
    }, []);

    return (
        <div className="bg-white min-h-screen">
            <section className="relative bg-[#050000] text-white py-20 md:py-32 px-6 md:px-8">
                <div className="max-w-[1440px] mx-auto text-center">
                    <h1 className="font-['Dorsa'] text-[56px] sm:text-[90px] md:text-[200px] tracking-[6px] md:tracking-[21.6px] leading-none mb-8">
                        BRACELETS
                    </h1>
                    <p className="font-['Centaur'] text-[#ccc] text-[18px] md:text-[24px] tracking-[3px] md:tracking-[4.32px] max-w-[700px] mx-auto">
                        Exquisite handcrafted beaded bracelets. Each piece is a unique accessory, meticulously designed and created by hand.
                    </p>
                </div>
            </section>

            <section className="py-16 px-6 md:px-8 bg-[#f8f8f8]">
                <div className="max-w-[900px] mx-auto text-center">
                    <p className="font-['Centaur'] text-[#333] text-[20px] md:text-[28px] tracking-[3px] md:tracking-[5.04px] italic leading-relaxed">
                        "A delicate bracelet is not just a detail — it's a reflection of your personality and timeless style."
                    </p>
                </div>
            </section>

            <section className="py-20 px-6 md:px-8">
                <div className="max-w-[1440px] mx-auto">
                    <div className="mb-12">
                        <h2 className="font-['Dorsa'] text-[44px] md:text-[72px] tracking-[6px] md:tracking-[12.96px] leading-none text-black mb-4">
                            Our Collection
                        </h2>
                        <p className="font-['Centaur'] text-[#333] text-[18px] md:text-[20px] tracking-[3.6px]">
                            Discover our curated selection of beaded bracelets
                        </p>
                    </div>

                    {loading ? (
                        <p className="font-['Centaur'] text-[24px] text-black/60 text-center py-10">
                            Loading beautiful bracelets...
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {bracelets.map((item) => {
                                const isInCart = items.some((cartItem) => cartItem.id === item._id);

                                return (
                                    <div key={item._id} className="group flex flex-col h-full">
                                        <div className="aspect-[4/4] bg-[#fafafa] mb-6 overflow-hidden relative border border-black/10 group">
                                            <img
                                                src={`${API}/${item.file_name.replace(/^\//, '')}`}
                                                alt={item.model_name}
                                                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                        </div>

                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-['Perpetua_Titling_MT'] text-[24px] tracking-[4.32px] text-black">
                                                {item.model_name}
                                            </h3>
                                            <span className="font-['Centaur'] text-[14px] tracking-[2.52px] text-[#999] bg-[#f5f5f5] px-3 py-1 uppercase">
                                                {item.style?.[0] || "Standard"}
                                            </span>
                                        </div>

                                        <p className="font-['Centaur'] text-[#666] text-[18px] tracking-[3.24px] mb-2 leading-relaxed">
                                            {item.details?.[0] || "Handcrafted with love."}
                                        </p>

                                        <Link
                                          to={`/products/${item._id}`}
                                          className="font-['Centaur'] text-[14px] tracking-[2.52px] text-black/50 hover:text-black transition-colors no-underline mb-4 inline-block"
                                        >
                                          View Details →
                                        </Link>

                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-['Perpetua_Titling_MT'] text-[32px] tracking-[5.76px] text-black">
                                                ${item.price || "0"}
                                            </span>

                                            <button
                                                onClick={() => !isInCart && addToCart(item)}
                                                className={`font-['Perpetua_Titling_MT'] text-[14px] tracking-[2.52px] px-8 py-3 rounded-full transition-colors border ${isInCart
                                                    ? "bg-white text-black border-black/30 cursor-default"
                                                    : "bg-[#050000] text-white border-transparent hover:bg-[#050000]/80 cursor-pointer"
                                                    }`}
                                            >
                                                {isInCart ? "In Cart" : "Add to Cart"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-black text-white py-20 px-6 md:px-8">
                <div className="max-w-[1200px] mx-auto">
                    <h2 className="font-['Dorsa'] text-[48px] md:text-[96px] tracking-[8px] md:tracking-[17.28px] leading-none mb-12 text-center">
                        Care Instructions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                                STORAGE
                            </h3>
                            <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                                Keep away from moisture to maintain the beads' finish.
                            </p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                                CLEANING
                            </h3>
                            <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                                Wipe gently with a dry, soft cloth after wearing.
                            </p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                                HANDLING
                            </h3>
                            <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                                Avoid pulling the thread to ensure durability.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}