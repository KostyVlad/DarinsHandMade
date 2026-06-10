import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

import skyBag from "../home/assets/skyCustomBagSection.png";
import blueBag from "../home/assets/blueCustomSectionbag.png";
import greenBag from "../home/assets/greenCustomSectionbag.png";
import pinkBag from "../home/assets/pinkCustomSectionbag.png";
import purpleBag from "../home/assets/purpleCustomSectionbag.png";

const SIZES = [
  { id: "mini", label: "Mini", cm: "10×8 cm", price: 120 },
  { id: "small", label: "Small", cm: "14×11 cm", price: 180 },
  { id: "medium", label: "Medium", cm: "20×16 cm", price: 260 },
  { id: "large", label: "Large", cm: "28×22 cm", price: 360 },
];

const STRAPS = [
  { id: "chain", label: "Gold Chain", price: 30, overlay: null },
  { id: "beaded", label: "Beaded Strap", price: 45, overlay: null },
  { id: "ribbon", label: "Silk Ribbon", price: 20, overlay: null },
  { id: "none", label: "Clutch", price: 0, overlay: null },
];

const COLORS = [
  { id: "sky", name: "Sky", hex: "#25cfff", image: skyBag },
  { id: "blue", name: "Cobalt", hex: "#2d46ff", image: blueBag },
  { id: "green", name: "Green", hex: "#39c24a", image: greenBag },
  { id: "pink", name: "Pink", hex: "#ff00f5", image: pinkBag },
  { id: "purple", name: "Purple", hex: "#8d47ff", image: purpleBag },
];

function BagPreview({ color, strap }) {
  return (
    <div className="relative w-full h-full">
      <img
        src={color.image}
        alt={`${color.name} beaded bag`}
        className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
      />
      {strap.overlay && (
        <img
          src={strap.overlay}
          alt={strap.label}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}
    </div>
  );
}

function StepHeader({ step, total, title }) {
  return (
    <div className="mb-6">
      <p className="font-['Centaur'] text-[13px] tracking-[3px] text-[#999] uppercase mb-1">
        Step {step} of {total}
      </p>
      <h3 className="font-['Dorsa'] text-[36px] tracking-[4px] text-black leading-none">
        {title}
      </h3>
    </div>
  );
}

const STEPS = ["Size", "Strap", "Color"];

export default function CustomStudioPage() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    size: "small",
    strap: "chain",
    color: COLORS[0],
  });
  const [addedToCart, setAddedToCart] = useState(false);
  const { addCustomItem } = useCart();
  const navigate = useNavigate();

  const sizeInfo = SIZES.find((s) => s.id === config.size);
  const strapInfo = STRAPS.find((s) => s.id === config.strap);
  const totalPrice = sizeInfo.price + strapInfo.price;

  function handleAddToCart() {
    const name = `Custom Beaded Bag — ${config.color.name} / ${strapInfo.label}`;
    addCustomItem({ id: `custom-${Date.now()}`, name, price: totalPrice, image: "", category: "custom", quantity: 1 });
    setAddedToCart(true);
    setTimeout(() => navigate("/cart"), 1200);
  }

  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white py-14 px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-['Dorsa'] text-[90px] md:text-[130px] tracking-[16px] leading-none mb-4"
        >
          Custom Studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-['Centaur'] text-[16px] tracking-[4px] text-white/70 uppercase"
        >
          Design your one-of-a-kind beaded bag
        </motion.p>
      </div>

      <div className="border-b border-black/10">
        <div className="max-w-[1200px] mx-auto px-8 flex items-center">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className="flex-1 py-4 text-center relative cursor-pointer bg-transparent border-none"
            >
              <span
                className={`font-['Perpetua_Titling_MT'] text-[11px] tracking-[2.5px] uppercase transition-colors ${i === step ? "text-black" : i < step ? "text-black/60" : "text-black/25"
                  }`}
              >
                {s}
              </span>
              {i === step && (
                <motion.div layoutId="stepIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
              )}
              {i < step && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/20" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div>
                  <StepHeader step={1} total={3} title="Choose Size" />
                  <div className="grid grid-cols-2 gap-4">
                    {SIZES.map((sz) => (
                      <button
                        key={sz.id}
                        onClick={() => setConfig((c) => ({ ...c, size: sz.id }))}
                        className={`px-5 py-5 border text-left transition-all cursor-pointer ${config.size === sz.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                          }`}
                      >
                        <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{sz.label}</p>
                        <p className={`font-['Centaur'] text-[12px] tracking-[1px] mt-1 ${config.size === sz.id ? "text-white/70" : "text-black/50"}`}>
                          {sz.cm}
                        </p>
                        <p className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-2 ${config.size === sz.id ? "text-white" : "text-black"}`}>
                          ${sz.price}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <StepHeader step={2} total={3} title="Choose Strap" />
                  <div className="grid grid-cols-2 gap-4">
                    {STRAPS.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setConfig((c) => ({ ...c, strap: st.id }))}
                        className={`px-5 py-5 border text-left transition-all cursor-pointer ${config.strap === st.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                          }`}
                      >
                        <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{st.label}</p>
                        <p className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-2 ${config.strap === st.id ? "text-white" : "text-black"}`}>
                          {st.price === 0 ? "Free" : `+$${st.price}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <StepHeader step={3} total={3} title="Choose Color" />
                  <div className="grid grid-cols-5 gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        title={c.name}
                        onClick={() => setConfig((cfg) => ({ ...cfg, color: c }))}
                        className="relative aspect-square rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.hex,
                          border: config.color.id === c.id ? "3px solid #000" : "1px solid rgba(0,0,0,0.15)",
                        }}
                      >
                        {config.color.id === c.id && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[14px] drop-shadow">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50 mt-3">Selected: {config.color.name}</p>

                  <div className="mt-10 border border-black/10 p-6 space-y-3">
                    <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-4">Order Summary</p>
                    {[
                      ["Size", `${sizeInfo.label} (${sizeInfo.cm})`],
                      ["Strap", strapInfo.label],
                      ["Color", config.color.name],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black/50">{k}</span>
                        <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black">{v}</span>
                      </div>
                    ))}
                    <div className="border-t border-black/10 pt-3 flex justify-between items-center">
                      <span className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[2px] uppercase">Total</span>
                      <span className="font-['Dorsa'] text-[40px] tracking-[2px] leading-none">${totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 mt-8">
            {canGoPrev && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-4 border border-black text-black font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/5 transition-colors cursor-pointer bg-transparent"
              >
                ← Back
              </button>
            )}
            {canGoNext ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors cursor-pointer border-none"
              >
                Next →
              </button>
            ) : (
              <motion.button
                onClick={handleAddToCart}
                whileTap={{ scale: 0.97 }}
                disabled={addedToCart}
                className="flex-1 py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors disabled:opacity-60 cursor-pointer border-none"
              >
                {addedToCart ? "Added ✓  Redirecting…" : `Add to Cart — $${totalPrice}`}
              </motion.button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-8">
          <div className="border border-black/10 p-2 bg-[#FAFAFA] aspect-square flex items-center justify-center">
            <motion.div
              key={`${config.color.id}-${config.strap}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full max-w-[380px] max-h-[380px] mx-auto"
            >
              <BagPreview color={config.color} strap={strapInfo} />
            </motion.div>
          </div>

          <div className="mt-4 flex items-center gap-3 px-2">
            <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: config.color.hex }} title={config.color.name} />
            <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
              {config.color.name} · {strapInfo.label}
            </span>
          </div>

          <div className="mt-6 flex items-end justify-between px-2">
            <div>
              <p className="font-['Centaur'] text-[13px] tracking-[3px] text-black/40 uppercase">Estimated price</p>
              <p className="font-['Dorsa'] text-[64px] tracking-[4px] leading-none text-black">${totalPrice}</p>
            </div>
            <div className="text-right">
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{sizeInfo.label}</p>
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{strapInfo.label}</p>
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40 mt-1">Made to order · 2–3 weeks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 py-12 px-8 text-center bg-black/[0.02]">
        <p className="font-['Centaur'] text-[15px] tracking-[3px] text-black/50 max-w-[600px] mx-auto">
          Every custom bag is handmade to order. After placing your order, our artisans will reach out within 48 hours to confirm the details and begin crafting your unique piece.
        </p>
      </div>
    </div>
  );
}
