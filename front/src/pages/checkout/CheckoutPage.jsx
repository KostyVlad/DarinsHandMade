import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../api";

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (deliveryMethod === "delivery") {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.country.trim()) e.country = "Required";
    }
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/orders/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items,
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: { address: form.address, city: form.city, country: form.country },
          deliveryMethod,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        setMessage(data.msg || "Could not start checkout.");
        setLoading(false);
      }
    } catch {
      setMessage("Server error. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center gap-8 px-8">
        <p className="font-['Dorsa'] text-[48px] md:text-[72px] tracking-[6px] md:tracking-[12px] text-black text-center">
          Your cart is empty
        </p>
        <Link
          to="/"
          className="font-['Centaur'] text-[18px] tracking-[3px] text-black underline hover:opacity-60 transition-opacity"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full bg-transparent border-b py-3 font-['Centaur'] text-[18px] tracking-[2px] text-black placeholder-black/30 outline-none transition-colors ${
      errors[field] ? "border-red-400" : "border-black/20 focus:border-black"
    }`;

  return (
    <div className="bg-white min-h-screen py-16 px-6 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-['Dorsa'] text-[56px] md:text-[96px] tracking-[8px] md:tracking-[17.28px] leading-none text-black mb-2 text-center">
          Checkout
        </h1>
        <p className="font-['Centaur'] text-[16px] md:text-[18px] tracking-[3px] text-[#888] text-center mb-16">
          Review your details and continue to secure payment
        </p>

        <div className="grid lg:grid-cols-3 gap-16">
          <form onSubmit={handleSubmit} noValidate className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
                Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className={inputClass("name")} />
                  {errors.name && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" className={inputClass("email")} />
                  {errors.email && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" className={inputClass("phone")} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
                Delivery Method
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "delivery", label: "Delivery", desc: "Ship to my address" },
                  { id: "pickup", label: "Self Pickup", desc: "Collect in person" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setDeliveryMethod(opt.id)}
                    className={`p-5 border text-left transition-all cursor-pointer ${
                      deliveryMethod === opt.id ? "border-black bg-black text-white" : "border-black/20 hover:border-black/50"
                    }`}
                  >
                    <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{opt.label}</p>
                    <p className={`font-['Centaur'] text-[13px] tracking-[1px] mt-1 ${deliveryMethod === opt.id ? "text-white/70" : "text-black/50"}`}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {deliveryMethod === "delivery" && (
              <div>
                <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Street Address" className={inputClass("address")} />
                    {errors.address && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputClass("city")} />
                    {errors.city && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className={inputClass("country")} />
                    {errors.country && <p className="text-red-500 text-[13px] tracking-[1px] mt-1">{errors.country}</p>}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="font-['Perpetua_Titling_MT'] text-[20px] tracking-[3.6px] text-black mb-6 uppercase">
                Notes
              </h2>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special requests or instructions..."
                rows={4}
                className="w-full bg-transparent border border-black/20 p-4 font-['Centaur'] text-[18px] tracking-[2px] text-black placeholder-black/30 outline-none focus:border-black transition-colors resize-none"
              />
            </div>

            {message && (
              <p className="text-red-500 font-['Centaur'] text-[15px] tracking-[1px]">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-['Perpetua_Titling_MT'] text-[16px] tracking-[2.88px] py-5 rounded-full hover:bg-black/80 transition-colors cursor-pointer border-none disabled:opacity-60"
            >
              {loading ? "Redirecting to payment…" : "Proceed to Payment"}
            </button>
          </form>

          <div className="lg:col-span-1">
            <div className="border border-black/20 p-8 sticky top-8">
              <h2 className="font-['Dorsa'] text-[48px] tracking-[8.64px] leading-none text-black mb-8 text-center">
                Your Order
              </h2>

              <div className="space-y-6 mb-8">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-16 h-16 bg-[#fafafa] flex-shrink-0 overflow-hidden border border-black/10">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Centaur'] text-[16px] tracking-[2px] text-black truncate">{item.name}</p>
                      <p className="font-['Centaur'] text-[14px] tracking-[1.5px] text-[#888]">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-['Perpetua_Titling_MT'] text-[18px] tracking-[2px] text-black flex-shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-black/10 pt-6 space-y-3">
                <div className="flex justify-between font-['Centaur'] text-[16px] tracking-[2.88px]">
                  <span className="text-[#666]">Subtotal</span>
                  <span className="text-black">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-['Centaur'] text-[16px] tracking-[2.88px]">
                  <span className="text-[#666]">Shipping</span>
                  <span className="text-black">Free</span>
                </div>
                <div className="border-t border-black/10 pt-3 mt-3">
                  <div className="flex justify-between font-['Dorsa'] text-[36px] tracking-[6.48px]">
                    <span className="text-black">Total</span>
                    <span className="text-black">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/cart"
                className="block text-center font-['Centaur'] text-[14px] tracking-[2px] text-black/50 hover:text-black transition-colors mt-6 no-underline"
              >
                ← Edit cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
