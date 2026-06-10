import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

export default function BeadedBagsPage() {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);

  const { items, addToCart } = useCart();

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        const data = await res.json();

        const bagsOnly = (data.data || []).filter(
          (product) => product.category === "bags"
        );

        setBags(bagsOnly);
      } catch (err) {
        console.error("Error loading products:", err);
        setBags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBags();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <section className="relative bg-[#050000] text-white py-32 px-8">
        <div className="max-w-[1440px] mx-auto text-center">
          <h1 className="font-['Dorsa'] text-[120px] md:text-[200px] tracking-[21.6px] leading-none mb-8">
            BEADED BAGS
          </h1>
          <p className="font-['Centaur'] text-[#ccc] text-[24px] tracking-[4.32px] max-w-[700px] mx-auto">
            Exquisite handcrafted beaded bags. Each bag is a work of art, meticulously designed and created by hand.
          </p>
        </div>
      </section>

      <section className="py-16 px-8 bg-[#f8f8f8]">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="font-['Centaur'] text-[#333] text-[28px] tracking-[5.04px] italic leading-relaxed">
            "A beaded bag is not just an accessory — it's a statement of elegance, craftsmanship, and timeless style."
          </p>
        </div>
      </section>

      <section className="py-20 px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12">
            <h2 className="font-['Dorsa'] text-[72px] tracking-[12.96px] leading-none text-black mb-4">
              Featured Collection
            </h2>
            <p className="font-['Centaur'] text-[#333] text-[20px] tracking-[3.6px]">
              Discover our curated selection of beaded bags
            </p>
          </div>

          {loading ? (
            <p className="font-['Centaur'] text-[24px] text-black/60 text-center py-10">
              Loading beautiful bags...
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {bags.map((bag) => {
                const isInCart = items.some((cartItem) => cartItem.id === bag._id);

                return (
                  <div key={bag._id} className="group flex flex-col h-full">
                    <div className="aspect-[4/4] bg-[#fafafa] mb-6 overflow-hidden relative border border-black/10 group">
                      <img
                        src={`http://localhost:5000/${bag.file_name.replace(/^\//, '')}`}
                        alt={bag.model_name}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                        onError={(e) => {
                          console.error("Image loading error:", e.target.src);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>

                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-['Perpetua_Titling_MT'] text-[24px] tracking-[4.32px] text-black">
                        {bag.model_name}
                      </h3>
                      <span className="font-['Centaur'] text-[14px] tracking-[2.52px] text-[#999] bg-[#f5f5f5] px-3 py-1 uppercase">
                        {bag.style?.[0] || "Standard"}
                      </span>
                    </div>

                    <p className="font-['Centaur'] text-[#666] text-[18px] tracking-[3.24px] mb-2 leading-relaxed">
                      {bag.details?.[0] || "Handcrafted with love."}
                    </p>

                    <Link
                      to={`/products/${bag._id}`}
                      className="font-['Centaur'] text-[14px] tracking-[2.52px] text-black/50 hover:text-black transition-colors no-underline mb-4 inline-block"
                    >
                      View Details →
                    </Link>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-['Perpetua_Titling_MT'] text-[32px] tracking-[5.76px] text-black">
                        ${bag.price || "0"}
                      </span>

                      <button
                        onClick={() => !isInCart && addToCart(bag)}
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

      <section className="bg-black text-white py-20 px-8">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-['Dorsa'] text-[96px] tracking-[17.28px] leading-none mb-12 text-center">
            Care Instructions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                STORAGE
              </h3>
              <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                Store in a dust bag away from direct sunlight to preserve the beads' luster.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                CLEANING
              </h3>
              <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                Gently wipe with a soft, dry cloth. Avoid water and harsh chemicals.
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] mb-4">
                HANDLING
              </h3>
              <p className="font-['Centaur'] text-[#ccc] text-[16px] tracking-[2.88px] leading-relaxed">
                Handle with care. Avoid catching beads on rough surfaces or sharp objects.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}