import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

import skyBag from "../home/assets/skyCustomBagSection.png";
import blueBag from "../home/assets/blueCustomSectionbag.png";
import greenBag from "../home/assets/greenCustomSectionbag.png";
import pinkBag from "../home/assets/pinkCustomSectionbag.png";
import purpleBag from "../home/assets/purpleCustomSectionbag.png";

// Real product photos, one per size (filenames match the cm dimensions below).
import sizeMini from "./10x8.png";
import sizeSmall from "./14x11.png";
import sizeMedium from "./20x16.png";
import sizeLarge from "./28x22.png";

// Strap variants — full bag photos, one per strap style, per size.
// Mini (10×8) photos:
import strapMiniGolden from "./10x8 handl/10x8 gold.png";
import strapMiniSilver from "./10x8 handl/10x8 silver.png";
import strapMiniMixedGold from "./10x8 handl/10x8 mixed stripe.png";
import strapMiniMixedSilver from "./10x8 handl/10x8 mixed stripe silver.png";
import strapMiniBeaded from "./10x8 handl/10x8 beaded stripe.png";
// Small (14×11) photos:
import strapSmallGolden from "./14x11 strap/14x11 gold.png";
import strapSmallSilver from "./14x11 strap/14x11 silver.png";
import strapSmallMixedGold from "./14x11 strap/14x11 golden and beaded.png";
import strapSmallMixedSilver from "./14x11 strap/14x11 silver and beaded.png";
import strapSmallBeaded from "./14x11 strap/14x11 beaded.png";

const SIZES = [
  { id: "mini", label: "Mini", cm: "10×8 cm", price: 120, image: sizeMini },
  { id: "small", label: "Small", cm: "14×11 cm", price: 180, image: sizeSmall },
  { id: "medium", label: "Medium", cm: "20×16 cm", price: 260, image: sizeMedium },
  { id: "large", label: "Large", cm: "28×22 cm", price: 360, image: sizeLarge },
];

const STRAPS = [
  { id: "golden", label: "Golden", price: 30, images: { mini: strapMiniGolden, small: strapSmallGolden } },
  { id: "silver", label: "Silver", price: 30, images: { mini: strapMiniSilver, small: strapSmallSilver } },
  {
    id: "mixed",
    label: "Mixed",
    price: 40,
    // Mixed comes with a gold or silver chain — both mini and small have both photos.
    chainImages: {
      gold: { mini: strapMiniMixedGold, small: strapSmallMixedGold },
      silver: { mini: strapMiniMixedSilver, small: strapSmallMixedSilver },
    },
  },
  { id: "beaded", label: "Beaded", price: 45, images: { mini: strapMiniBeaded, small: strapSmallBeaded } },
];

// Strap photos only exist for mini/small; other sizes fall back to the mini photo.
// Mixed strap has a chain color (gold/silver); we pick its photo from chainImages.
function strapImageFor(strap, sizeId, chainColor = "gold") {
  const set = strap.chainImages ? strap.chainImages[chainColor] || strap.chainImages.gold : strap.images;
  // Guard against a misconfigured strap (missing images/variant) instead of crashing the render.
  if (!set) return strap.images?.mini ?? "";
  return set[sizeId] || set.mini;
}

// Display label for a strap; Mixed appends its chain color (e.g. "Mixed (Gold)").
function strapLabelFor(strap, chainColor) {
  if (strap.id !== "mixed") return strap.label;
  return `${strap.label} (${chainColor === "gold" ? "Gold" : "Silver"})`;
}

const COLORS = [
  { id: "sky", name: "Sky", hex: "#25cfff", image: skyBag },
  { id: "blue", name: "Cobalt", hex: "#2d46ff", image: blueBag },
  { id: "green", name: "Green", hex: "#39c24a", image: greenBag },
  { id: "pink", name: "Pink", hex: "#ff00f5", image: pinkBag },
  { id: "purple", name: "Purple", hex: "#8d47ff", image: purpleBag },
];

function BagPreview({ image, alt }) {
  return (
    <div className="relative w-full h-full">
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
      />
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
    size: "small", // intentional default — "Small" is the most popular size, not SIZES[0] ("Mini")
    strap: "golden",
    chainColor: "gold",
    color: COLORS[0],
  });
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { addCustomItem } = useCart();
  const navigate = useNavigate();

  const sizeInfo = SIZES.find((s) => s.id === config.size);
  const strapInfo = STRAPS.find((s) => s.id === config.strap);
  const totalPrice = sizeInfo.price + strapInfo.price;

  // "Mixed" shows its chain color in the display label; other straps just use their label.
  const strapLabel = strapLabelFor(strapInfo, config.chainColor);

  // Preview follows the active step: size photo on Size, strap photo otherwise.
  const previewImage = step === 0 ? sizeInfo.image : strapImageFor(strapInfo, config.size, config.chainColor);
  const previewLabel = step === 0 ? `${sizeInfo.label} · ${sizeInfo.cm}` : `${sizeInfo.label} · ${strapLabel}`;

  // A new configuration is a new product — re-enable the Add-to-Cart button on any change.
  function updateConfig(patch) {
    setConfig((c) => ({ ...c, ...patch }));
    setAddedToCart(false);
  }

  // Drive the post-add redirect from an effect so the timer is cleared if the user leaves first.
  useEffect(() => {
    if (!addedToCart) return;
    const timer = setTimeout(() => navigate("/cart"), 1200);
    return () => clearTimeout(timer);
  }, [addedToCart, navigate]);

  function handleAddToCart() {
    const name = `Custom Beaded Bag — ${config.color.name} / ${strapLabel}`;
    addCustomItem({
      id: `custom-${Date.now()}`,
      name,
      price: totalPrice,
      image: strapImageFor(strapInfo, config.size, config.chainColor), // real thumbnail, not ""
      category: "custom",
      quantity: 1,
      config: {
        // Structured, machine-readable record so the order is reconstructable.
        size: config.size,
        strap: config.strap,
        chainColor: strapInfo.id === "mixed" ? config.chainColor : null,
        color: config.color.id,
      },
    });
    setAddedToCart(true);
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
                        onClick={() => updateConfig({ size: sz.id })}
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
                      // Wrapper hosts the selectable button and the zoom button as siblings
                      // (no interactive element nested inside another — valid, accessible DOM).
                      <div key={st.id} className="group relative">
                        <button
                          onClick={() => updateConfig({ strap: st.id })}
                          className={`w-full p-4 border text-left transition-all cursor-pointer ${config.strap === st.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                            }`}
                        >
                          <div className="relative aspect-square mb-3 overflow-hidden bg-[#FAFAFA]">
                            <img
                              src={strapImageFor(st, config.size, config.chainColor)}
                              alt={`${st.label} strap`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">{st.label}</p>
                          <p className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-1 ${config.strap === st.id ? "text-white" : "text-black"}`}>
                            {st.price === 0 ? "Free" : `+$${st.price}`}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              image: strapImageFor(st, config.size, config.chainColor),
                              label: `${sizeInfo.label} · ${strapLabelFor(st, config.chainColor)}`,
                            })
                          }
                          aria-label={`View ${st.label} strap photo`}
                          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-black text-[15px] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-white cursor-zoom-in border-none"
                        >
                          <span aria-hidden="true">⛶</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {config.strap === "mixed" && (
                    <div className="mt-6">
                      <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-3">
                        Chain finish
                      </p>
                      <div className="flex gap-3">
                        {[
                          { id: "gold", label: "Gold" },
                          { id: "silver", label: "Silver" },
                        ].map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => updateConfig({ chainColor: chain.id })}
                            className={`flex-1 py-3 border font-['Perpetua_Titling_MT'] text-[12px] tracking-[2px] uppercase transition-all cursor-pointer ${config.chainColor === chain.id
                              ? "border-black bg-black text-white"
                              : "border-black/20 bg-white text-black hover:border-black/50"
                              }`}
                          >
                            {chain.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                        aria-label={c.name}
                        aria-pressed={config.color.id === c.id}
                        onClick={() => updateConfig({ color: c })}
                        className="relative aspect-square rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.hex,
                          border: config.color.id === c.id ? "3px solid #000" : "1px solid rgba(0,0,0,0.15)",
                        }}
                      >
                        {config.color.id === c.id && (
                          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-white text-[14px] drop-shadow">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50 mt-3">Selected: {config.color.name}</p>

                  <div className="mt-10 border border-black/10 p-6 space-y-3">
                    <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-4">Order Summary</p>
                    {[
                      ["Size", `${sizeInfo.label} (${sizeInfo.cm})`],
                      ["Strap", strapLabel],
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
          <div className="group border border-black/10 p-2 bg-[#FAFAFA] aspect-square flex items-center justify-center overflow-hidden">
            <motion.div
              key={previewImage}
              role="button"
              tabIndex={0}
              aria-label={`View ${previewLabel} photo`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setLightbox({ image: previewImage, label: previewLabel })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightbox({ image: previewImage, label: previewLabel });
                }
              }}
              className="w-full h-full max-w-[380px] max-h-[380px] mx-auto cursor-zoom-in transition-transform duration-500 group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
            >
              <BagPreview image={previewImage} alt={`${sizeInfo.label} beaded bag · ${strapInfo.label} strap`} />
            </motion.div>
          </div>

          {step === 2 ? (
            <div className="mt-4 flex items-center gap-3 px-2">
              <div className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: config.color.hex }} title={config.color.name} />
              <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
                {config.color.name} · {strapLabel}
              </span>
            </div>
          ) : (
            <div className="mt-4 px-2">
              <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
                {step === 0 ? sizeInfo.label : strapLabel}
              </span>
            </div>
          )}

          <div className="mt-6 flex items-end justify-between px-2">
            <div>
              <p className="font-['Centaur'] text-[13px] tracking-[3px] text-black/40 uppercase">Estimated price</p>
              <p className="font-['Dorsa'] text-[64px] tracking-[4px] leading-none text-black">${totalPrice}</p>
            </div>
            <div className="text-right">
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{sizeInfo.label}</p>
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">{strapLabel}</p>
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

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 cursor-zoom-out"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-[22px] hover:bg-white/20 transition-colors cursor-pointer border-none"
              aria-label="Close"
              title="Close"
            >
              <span aria-hidden="true">✕</span>
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col items-center gap-4"
            >
              <img
                src={lightbox.image}
                alt={lightbox.label}
                className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl"
              />
              <p className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase text-white/80">
                {lightbox.label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
