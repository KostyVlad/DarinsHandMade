import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ArrowLeft } from "lucide-react";
import { API } from "../../api";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API}/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <p className="font-['Centaur'] text-[24px] text-black/60 tracking-[4px]">Loading...</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8">
        <p className="font-['Dorsa'] text-[72px] tracking-[12px] text-black">Product Not Found</p>
        <Link
          to="/"
          className="font-['Centaur'] text-[18px] tracking-[3px] text-black underline hover:opacity-60 transition-opacity"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const isInCart = items.some((item) => item.id === product._id);
  const outOfStock = product.stock === 0;
  const backPath = product.category === "bracelets" ? "/bracelets" : "/beaded-bags";
  const backLabel = product.category === "bracelets" ? "Bracelets" : "Beaded Bags";

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 font-['Centaur'] text-[16px] tracking-[2.88px] text-black/60 hover:text-black transition-colors cursor-pointer bg-transparent border-none p-0 mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {backLabel}
        </button>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="aspect-square bg-[#fafafa] overflow-hidden border border-black/10">
            <img
              src={`${API}/${product.file_name.replace(/^\//, "")}`}
              alt={product.model_name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="font-['Centaur'] text-[14px] tracking-[3.6px] text-[#999] uppercase mb-4">
              {product.category}
            </span>

            <h1 className="font-['Perpetua_Titling_MT'] text-[48px] md:text-[64px] tracking-[8px] leading-tight text-black mb-6">
              {product.model_name}
            </h1>

            {product.style?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.style.map((s, i) => (
                  <span
                    key={i}
                    className="font-['Centaur'] text-[13px] tracking-[2.34px] text-[#666] bg-[#f5f5f5] px-4 py-1.5 uppercase"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {product.details?.length > 0 && (
              <div className="mb-8">
                {product.details.map((detail, i) => (
                  <p
                    key={i}
                    className="font-['Centaur'] text-[18px] tracking-[3.24px] text-[#555] leading-relaxed mb-2"
                  >
                    {detail}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-10 border-t border-b border-black/10 py-6">
              <span className="font-['Centaur'] text-[16px] tracking-[2.88px] text-[#888]">Price</span>
              <span className="font-['Perpetua_Titling_MT'] text-[48px] tracking-[8px] text-black">
                ${product.price || "0"}
              </span>
            </div>

            {typeof product.stock === "number" && (
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    outOfStock ? "bg-red-600" : product.stock <= 3 ? "bg-amber-500" : "bg-green-600"
                  }`}
                />
                <span
                  className={`font-['Centaur'] text-[15px] tracking-[2px] ${
                    outOfStock ? "text-red-600" : product.stock <= 3 ? "text-amber-600" : "text-black/70"
                  }`}
                >
                  {outOfStock
                    ? "Currently out of stock"
                    : product.stock <= 3
                      ? `Hurry — only ${product.stock} left in stock`
                      : `${product.stock} in stock`}
                </span>
              </div>
            )}

            <button
              onClick={() => !isInCart && !outOfStock && addToCart(product)}
              disabled={outOfStock}
              className={`w-full font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] py-5 rounded-full transition-colors border ${
                outOfStock
                  ? "bg-white text-black/40 border-black/15 cursor-not-allowed"
                  : isInCart
                    ? "bg-white text-black border-black/30 cursor-default"
                    : "bg-[#050000] text-white border-transparent hover:bg-[#050000]/80 cursor-pointer"
              }`}
            >
              {outOfStock ? "Out of Stock" : isInCart ? "Added to Cart" : "Add to Cart"}
            </button>

            <p className="font-['Centaur'] text-[14px] tracking-[2.52px] text-[#999] text-center mt-4">
              Handmade with care · Ships within 7–14 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
