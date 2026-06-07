import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen py-20 px-8">
        <div className="max-w-[1200px] mx-auto text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-8 text-black/20" strokeWidth={1} />
          <h1 className="font-['Dorsa:Regular',sans-serif] text-[120px] tracking-[21.6px] leading-none text-black mb-8">
            Your Cart is Empty
          </h1>
          <p className="font-['Centaur:Regular',sans-serif] text-[#666] text-[24px] tracking-[4.32px] mb-12">
            Discover our handmade treasures and add some beauty to your collection
          </p>
          <Link
            to="/"
            className="inline-block bg-black text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[16px] tracking-[2.88px] px-12 py-4 rounded-full hover:bg-black/80 transition-colors no-underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-16 px-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="font-['Dorsa:Regular',sans-serif] text-[120px] tracking-[21.6px] leading-none text-black mb-4 text-center">
          Shopping Cart
        </h1>
        <p className="font-['Centaur:Regular',sans-serif] text-[#666] text-[20px] tracking-[3.6px] text-center mb-12">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>

        <div className="grid lg:grid-cols-3 gap-12">

          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-black/10 p-6 flex gap-6 hover:border-black/30 transition-colors"
              >

                <div className="w-32 h-32 bg-[#fafafa] flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>


                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[12px] tracking-[2.16px] text-[#666] mb-2 uppercase">
                      {item.category}
                    </p>
                    <h3 className="font-['Centaur:Regular',sans-serif] text-[24px] tracking-[4.32px] text-black mb-3 m-0">
                      {item.name}
                    </h3>
                    <p className="font-['Dorsa:Regular',sans-serif] text-[32px] tracking-[5.76px] text-black m-0">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                 
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 border border-black/20 rounded-full">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-black/5 transition-colors rounded-l-full cursor-pointer bg-transparent border-none"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px] w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-black/5 transition-colors rounded-r-full cursor-pointer bg-transparent border-none"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 hover:bg-red-50 text-red-600 transition-colors rounded-full cursor-pointer bg-transparent border-none"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>


                <div className="flex flex-col justify-between items-end">
                  <p className="font-['Dorsa:Regular',sans-serif] text-[36px] tracking-[6.48px] text-black m-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}


            <button
              onClick={clearCart}
              className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2.88px] text-red-600 hover:text-red-700 underline transition-colors cursor-pointer bg-transparent border-none p-0 mt-4"
            >
              Clear all items
            </button>
          </div>

          
          <div className="lg:col-span-1">
            <div className="border border-black/20 p-8 sticky top-8">
              <h2 className="font-['Dorsa:Regular',sans-serif] text-[48px] tracking-[8.64px] leading-none text-black mb-8 text-center m-0">
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px]">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="text-black">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-['Centaur:Regular',sans-serif] text-[18px] tracking-[3.24px]">
                  <span className="text-[#666]">Shipping</span>
                  <span className="text-black">Free</span>
                </div>
                <div className="border-t border-black/10 pt-4 mt-4">
                  <div className="flex justify-between font-['Dorsa:Regular',sans-serif] text-[36px] tracking-[6.48px]">
                    <span className="text-black">Total</span>
                    <span className="text-black">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-black text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[16px] tracking-[2.88px] py-4 rounded-full hover:bg-black/80 transition-colors mb-4 cursor-pointer border-none">
                Checkout
              </button>

              <Link
                to="/"
                className="block text-center font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2.88px] text-black hover:opacity-70 transition-opacity no-underline"
              >
                Continue Shopping
              </Link>

              <div className="mt-8 pt-8 border-t border-black/10">
                <h3 className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[14px] tracking-[2.52px] mb-4 text-center m-0">
                  We Accept
                </h3>
                <div className="flex justify-center gap-3 flex-wrap">
                  <div className="w-12 h-8 border border-black/20 rounded flex items-center justify-center text-[10px] font-bold">
                    VISA
                  </div>
                  <div className="w-12 h-8 border border-black/20 rounded flex items-center justify-center text-[10px] font-bold">
                    MC
                  </div>
                  <div className="w-12 h-8 border border-black/20 rounded flex items-center justify-center text-[10px] font-bold">
                    AMEX
                  </div>
                  <div className="w-12 h-8 border border-black/20 rounded flex items-center justify-center text-[10px] font-bold">
                    PP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}