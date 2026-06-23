import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { API } from "../../api";

export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);

  // Payment succeeded — empty the cart and pull a small order summary to show.
  useEffect(() => {
    clearCart();
    if (!sessionId) return;
    let active = true;
    fetch(`${API}/api/orders/by-session/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.success) setOrder(data.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // clearCart is stable enough for this one-shot effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center py-20">
      <CheckCircle className="w-20 h-20 text-green-600/70" strokeWidth={1} />
      <h1 className="font-['Dorsa'] text-[56px] md:text-[96px] tracking-[8px] md:tracking-[17px] leading-none text-black">
        Thank You
      </h1>

      {order ? (
        <p className="font-['Centaur'] text-[18px] md:text-[22px] tracking-[2px] text-[#666] max-w-[560px] leading-relaxed">
          Your payment was successful and order{" "}
          <span className="text-black font-semibold">{order.orderNumber}</span> is confirmed.
          A receipt has been sent to <span className="text-black">{order.email}</span>.
        </p>
      ) : (
        <p className="font-['Centaur'] text-[18px] md:text-[22px] tracking-[2px] text-[#666] max-w-[560px] leading-relaxed">
          Your payment was successful and your order is confirmed. A receipt has been sent to your email.
        </p>
      )}

      <Link
        to="/"
        className="mt-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] px-12 py-4 rounded-full hover:bg-black/80 transition-colors no-underline"
      >
        Back to Home
      </Link>
    </div>
  );
}
