import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SIZES = [
  { id: "mini", label: "Mini", cm: "10×8 cm", price: 120 },
  { id: "small", label: "Small", cm: "14×11 cm", price: 180 },
  { id: "medium", label: "Medium", cm: "20×16 cm", price: 260 },
  { id: "large", label: "Large", cm: "28×22 cm", price: 360 },
];

const STRAPS = [
  { id: "chain", label: "Gold Chain", price: 30 },
  { id: "beaded", label: "Beaded Strap", price: 45 },
  { id: "ribbon", label: "Silk Ribbon", price: 20 },
  { id: "none", label: "Clutch", price: 0 },
];

const PATTERNS = [
  { id: "solid", label: "Solid", icon: "■" },
  { id: "checkerboard", label: "Checker", icon: "▦" },
  { id: "geometric", label: "Geometric", icon: "◆" },
  { id: "ombre", label: "Ombre", icon: "▣" },
  { id: "floral", label: "Floral", icon: "✿" },
];

const BEAD_COLORS = [
  { id: "ivory", name: "Ivory", hex: "#F5F0E8" },
  { id: "pearl", name: "Pearl", hex: "#E8E4DC" },
  { id: "onyx", name: "Onyx", hex: "#1A1A1A" },
  { id: "charcoal", name: "Charcoal", hex: "#4A4A4A" },
  { id: "champagne", name: "Champagne", hex: "#C8A96E" },
  { id: "gold", name: "Gold", hex: "#D4AF37" },
  { id: "silver", name: "Silver", hex: "#A8A9AD" },
  { id: "blush", name: "Blush", hex: "#E8C4B8" },
  { id: "dusty-rose", name: "Dusty Rose", hex: "#C4858A" },
  { id: "burgundy", name: "Burgundy", hex: "#6D2B3D" },
  { id: "midnight", name: "Midnight", hex: "#1A1A3E" },
  { id: "sage", name: "Sage", hex: "#7A8C7A" },
  { id: "terracotta", name: "Terracotta", hex: "#B85C38" },
  { id: "cobalt", name: "Cobalt", hex: "#1F3A6E" },
  { id: "emerald", name: "Emerald", hex: "#1A5C3A" },
  { id: "nude", name: "Nude", hex: "#D4B8A0" },
];

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// ─── SVG Bead Grid ────────────────────────────────────────────────────────────

function BeadGrid({ width, height, startX = 0, startY = 0, clipId, primary, accent, pattern }) {
  const beadSize = 7;
  const gap = 1;
  const step = beadSize + gap;
  const cols = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;

  const beads = useMemo(() => {
    const list = [];
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 0 ? 0 : step / 2;
      for (let col = 0; col < cols; col++) {
        const x = startX + col * step + offset;
        const y = startY + row * step;
        let fill = primary;
        if (pattern === "solid") {
          fill = primary;
        } else if (pattern === "checkerboard") {
          fill = (row + col) % 2 === 0 ? primary : accent;
        } else if (pattern === "geometric") {
          fill = (row + col) % 6 < 3 ? primary : accent;
        } else if (pattern === "ombre") {
          fill = row / rows < 0.5 ? primary : accent;
        } else if (pattern === "floral") {
          const fx = col % 5;
          const fy = row % 5;
          const isCenter = fx === 2 && fy === 2;
          const isPetal =
            (fx === 2 && (fy === 1 || fy === 3)) ||
            (fy === 2 && (fx === 1 || fx === 3));
          fill = isCenter || isPetal ? accent : primary;
        }
        list.push({ x, y, fill, r: beadSize / 2 });
      }
    }
    return list;
  }, [rows, cols, step, primary, accent, pattern, startX, startY]);

  return (
    <g clipPath={`url(#${clipId})`}>
      {beads.map((b, i) => (
        <circle
          key={i}
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={b.fill}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

// ─── SVG Bag Preview (Classic Beaded Flap Bag) ────────────────────────────────

function BagSVG({ config }) {
  const p = config.primaryColor.hex;
  const a = config.accentColor.hex;
  const pat = config.pattern;
  const strapColor =
    config.strap === "chain" ? "#D4AF37" : config.strap === "ribbon" ? "#C8A0B0" : p;

  return (
    <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <defs>
        {/* Маска для ограничения бисера границами сумки */}
        <clipPath id="bagBodyClip">
          <rect x="35" y="100" width="210" height="150" rx="12" />
        </clipPath>
        
        {/* Градиент для придания объема */}
        <linearGradient id="volumeShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="70%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </linearGradient>
      </defs>

      {/* 1. Боковые ремешки (Straps) */}
      {config.strap === "chain" && (
        <path d="M 40 115 L 5 0 M 240 115 L 275 0" fill="none" stroke={strapColor} strokeWidth="5" strokeDasharray="8 4" />
      )}
      {config.strap === "beaded" && (
        <path d="M 40 115 L 5 0 M 240 115 L 275 0" fill="none" stroke={strapColor} strokeWidth="8" strokeLinecap="round" strokeDasharray="0 10" />
      )}
      {config.strap === "ribbon" && (
        <path d="M 40 115 Q 20 60 5 0 M 240 115 Q 260 60 275 0" fill="none" stroke={strapColor} strokeWidth="14" opacity="0.9" />
      )}

      {/* 2. Верхняя жесткая ручка (Top Handle) */}
      <g>
        {/* Тень под ручкой */}
        <path d="M 75 100 C 75 10, 205 10, 205 100" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="16" strokeLinecap="round" strokeDasharray="0 17" transform="translate(0, 3)" />
        {/* Сама ручка (имитация крупных круглых бусин через пунктир) */}
        <path d="M 75 100 C 75 10, 205 10, 205 100" fill="none" stroke={p} strokeWidth="16" strokeLinecap="round" strokeDasharray="0 17" />
        {/* Блик на ручке */}
        <path d="M 75 100 C 75 10, 205 10, 205 100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="6" strokeLinecap="round" strokeDasharray="0 17" transform="translate(-2, -2)" />
      </g>

      {/* 3. Основной корпус сумки */}
      <rect x="35" y="100" width="210" height="150" rx="12" fill={p} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />

      {/* 4. Генерация бисерного узора на корпусе */}
      <BeadGrid width={220} height={160} startX={30} startY={95} clipId="bagBodyClip" primary={p} accent={a} pattern={pat} />

      {/* 5. Объемный градиент корпуса */}
      <rect x="35" y="100" width="210" height="150" rx="12" fill="url(#volumeShadow)" clipPath="url(#bagBodyClip)" pointerEvents="none" />

      {/* 6. Линия клапана (Flap) с тенью */}
      {/* Тень под клапаном */}
      <path d="M 35 190 Q 140 215 245 190" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="4" />
      {/* Граница клапана */}
      <path d="M 35 190 Q 140 215 245 190" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" transform="translate(0, -2)" />

      {/* 7. Боковые кольца для ремешка */}
      <circle cx="40" cy="115" r="7" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />
      <circle cx="240" cy="115" r="7" fill="none" stroke="#C0C0C0" strokeWidth="2.5" />

      {/* 8. Металлическая табличка (Logo Plate) */}
      <g transform="translate(140, 185)">
        <rect x="-30" y="-8" width="60" height="16" rx="2" fill="#E8E8E8" stroke="#999" strokeWidth="1" />
        {/* Эффект металла */}
        <rect x="-29" y="-7" width="58" height="7" rx="1" fill="rgba(255,255,255,0.6)" />
        <text x="0" y="3" fontSize="8" fontFamily="Perpetua_Titling_MT, serif" fill="#111" textAnchor="middle" fontWeight="bold" letterSpacing="1.5">
          DARIN'S
        </text>
      </g>
    </svg>
  );
}

// ─── Step Header ──────────────────────────────────────────────────────────────

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

// ─── Color Swatch Grid ────────────────────────────────────────────────────────

function ColorGrid({ colors, selected, onSelect }) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {colors.map((c) => (
        <button
          key={c.id}
          title={c.name}
          onClick={() => onSelect(c)}
          className="relative"
        >
          <div
            className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: c.hex,
              borderColor: selected.id === c.id ? "#000" : "transparent",
              boxShadow:
                selected.id === c.id
                  ? "0 0 0 1px #000"
                  : "0 0 0 1px rgba(0,0,0,0.12)",
            }}
          />
          {selected.id === c.id && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[10px]"
                style={{ color: isLight(c.hex) ? "#000" : "#fff" }}
              >
                ✓
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = ["Size", "Strap", "Colors", "Pattern"];

export default function CustomStudioPage() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    size: "small",
    strap: "chain",
    primaryColor: BEAD_COLORS[0],
    accentColor: BEAD_COLORS[3],
    pattern: "geometric",
  });
  const [addedToCart, setAddedToCart] = useState(false);
  const { addCustomItem } = useCart();
  const navigate = useNavigate();

  const sizeInfo = SIZES.find((s) => s.id === config.size);
  const strapInfo = STRAPS.find((s) => s.id === config.strap);
  const totalPrice = sizeInfo.price + strapInfo.price;

  function handleAddToCart() {
    const name = `Custom Beaded Bag — ${config.primaryColor.name} / ${config.accentColor.name}`;
    addCustomItem({
      id: `custom-${Date.now()}`,
      name,
      price: totalPrice,
      image: "",
      category: "custom",
      quantity: 1,
    });
    setAddedToCart(true);
    setTimeout(() => navigate("/cart"), 1200);
  }

  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
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

      {/* Progress bar */}
      <div className="border-b border-black/10">
        <div className="max-w-[1200px] mx-auto px-8 flex items-center">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className="flex-1 py-4 text-center relative cursor-pointer bg-transparent border-none"
            >
              <span
                className={`font-['Perpetua_Titling_MT'] text-[11px] tracking-[2.5px] uppercase transition-colors ${
                  i === step ? "text-black" : i < step ? "text-black/60" : "text-black/25"
                }`}
              >
                {s}
              </span>
              {i === step && (
                <motion.div
                  layoutId="stepIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                />
              )}
              {i < step && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/20" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1200px] mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left — configurator */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 0 — Size */}
              {step === 0 && (
                <div>
                  <StepHeader step={1} total={4} title="Choose Size" />
                  <div className="grid grid-cols-2 gap-4">
                    {SIZES.map((sz) => (
                      <button
                        key={sz.id}
                        onClick={() => setConfig((c) => ({ ...c, size: sz.id }))}
                        className={`px-5 py-5 border text-left transition-all cursor-pointer ${
                          config.size === sz.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                        }`}
                      >
                        <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">
                          {sz.label}
                        </p>
                        <p
                          className={`font-['Centaur'] text-[12px] tracking-[1px] mt-1 ${
                            config.size === sz.id ? "text-white/70" : "text-black/50"
                          }`}
                        >
                          {sz.cm}
                        </p>
                        <p
                          className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-2 ${
                            config.size === sz.id ? "text-white" : "text-black"
                          }`}
                        >
                          ${sz.price}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1 — Strap */}
              {step === 1 && (
                <div>
                  <StepHeader step={2} total={4} title="Choose Strap" />
                  <div className="grid grid-cols-2 gap-4">
                    {STRAPS.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setConfig((c) => ({ ...c, strap: st.id }))}
                        className={`px-5 py-5 border text-left transition-all cursor-pointer ${
                          config.strap === st.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                        }`}
                      >
                        <p className="font-['Perpetua_Titling_MT'] text-[13px] tracking-[2px] uppercase">
                          {st.label}
                        </p>
                        <p
                          className={`font-['Dorsa'] text-[28px] tracking-[2px] mt-2 ${
                            config.strap === st.id ? "text-white" : "text-black"
                          }`}
                        >
                          {st.price === 0 ? "Free" : `+$${st.price}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — Colors */}
              {step === 2 && (
                <div>
                  <StepHeader step={3} total={4} title="Choose Colors" />
                  <div className="mb-8">
                    <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-3">
                      Primary color
                    </p>
                    <ColorGrid
                      colors={BEAD_COLORS}
                      selected={config.primaryColor}
                      onSelect={(c) => setConfig((cfg) => ({ ...cfg, primaryColor: c }))}
                    />
                    <p className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50 mt-2">
                      Selected: {config.primaryColor.name}
                    </p>
                  </div>
                  <div>
                    <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-3">
                      Accent color
                    </p>
                    <ColorGrid
                      colors={BEAD_COLORS}
                      selected={config.accentColor}
                      onSelect={(c) => setConfig((cfg) => ({ ...cfg, accentColor: c }))}
                    />
                    <p className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50 mt-2">
                      Selected: {config.accentColor.name}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3 — Pattern */}
              {step === 3 && (
                <div>
                  <StepHeader step={4} total={4} title="Choose Pattern" />
                  <div className="grid grid-cols-1 gap-3">
                    {PATTERNS.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => setConfig((c) => ({ ...c, pattern: pt.id }))}
                        className={`flex items-center gap-5 px-6 py-4 border transition-all cursor-pointer ${
                          config.pattern === pt.id
                            ? "border-black bg-black text-white"
                            : "border-black/20 bg-white text-black hover:border-black/50"
                        }`}
                      >
                        <span className="text-[24px]">{pt.icon}</span>
                        <p className="font-['Perpetua_Titling_MT'] text-[14px] tracking-[2px] uppercase">
                          {pt.label}
                        </p>
                        {config.pattern === pt.id && (
                          <span className="ml-auto text-white">✓</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Order summary */}
                  <div className="mt-10 border border-black/10 p-6 space-y-3">
                    <p className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] uppercase text-black/50 mb-4">
                      Order Summary
                    </p>
                    {[
                      ["Size", `${sizeInfo.label} (${sizeInfo.cm})`],
                      ["Strap", strapInfo.label],
                      ["Primary", config.primaryColor.name],
                      ["Accent", config.accentColor.name],
                      ["Pattern", config.pattern.charAt(0).toUpperCase() + config.pattern.slice(1)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black/50">{k}</span>
                        <span className="font-['Centaur'] text-[14px] tracking-[2px] text-black">{v}</span>
                      </div>
                    ))}
                    <div className="border-t border-black/10 pt-3 flex justify-between items-center">
                      <span className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[2px] uppercase">
                        Total
                      </span>
                      <span className="font-['Dorsa'] text-[40px] tracking-[2px] leading-none">
                        ${totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
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

        {/* Right — live preview */}
        <div className="lg:sticky lg:top-8">
          <div className="border border-black/10 p-2 bg-[#FAFAFA] aspect-square flex items-center justify-center">
            <motion.div
              key={`${config.primaryColor.id}-${config.accentColor.id}-${config.pattern}-${config.strap}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full max-w-[380px] max-h-[380px] mx-auto"
            >
              {/* Рендерим новую форму сумки */}
              <BagSVG config={config} />
            </motion.div>
          </div>

          {/* Color swatches */}
          <div className="mt-4 flex items-center gap-3 px-2">
            <div
              className="w-6 h-6 rounded-full border border-black/20"
              style={{ backgroundColor: config.primaryColor.hex }}
              title={config.primaryColor.name}
            />
            <div
              className="w-6 h-6 rounded-full border border-black/20"
              style={{ backgroundColor: config.accentColor.hex }}
              title={config.accentColor.name}
            />
            <span className="font-['Centaur'] text-[13px] tracking-[2px] text-black/50">
              {config.primaryColor.name} + {config.accentColor.name} · {config.pattern}
            </span>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-end justify-between px-2">
            <div>
              <p className="font-['Centaur'] text-[13px] tracking-[3px] text-black/40 uppercase">
                Estimated price
              </p>
              <p className="font-['Dorsa'] text-[64px] tracking-[4px] leading-none text-black">
                ${totalPrice}
              </p>
            </div>
            <div className="text-right">
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">
                {sizeInfo.label}
              </p>
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40">
                {strapInfo.label}
              </p>
              <p className="font-['Centaur'] text-[12px] tracking-[2px] text-black/40 mt-1">
                Made to order · 2–3 weeks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="border-t border-black/10 py-12 px-8 text-center bg-black/[0.02]">
        <p className="font-['Centaur'] text-[15px] tracking-[3px] text-black/50 max-w-[600px] mx-auto">
          Every custom bag is handmade to order. After placing your order, our artisans will reach out within 48 hours to confirm the details and begin crafting your unique piece.
        </p>
      </div>
    </div>
  );
}