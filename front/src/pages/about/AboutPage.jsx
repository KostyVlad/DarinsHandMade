import { useState } from "react";
import { motion } from "framer-motion";
import bgImage from "./BACKGROUDN.png";

// Crystal-bead tones to match the beaded bags — cobalt, royal, cyan, aqua, clear, lilac sheen.
const BEAD_COLORS = ["#2F6BFF", "#1B3FD1", "#36C5F0", "#7FE3FF", "#BFEAFF", "#E8F7FF", "#9B8CFF"];

export default function AboutPage() {
  // Generate the beads once, on first render (random values, so not derived from props/state).
  const [beads] = useState(() =>
    Array.from({ length: 44 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 8,
      size: Math.random() * 14 + 8,
      sway: Math.random() * 3 + 3,
      color: BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)],
    }))
  );

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20vh) rotate(0deg);   opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
        /* Gentle side-to-side drift — uses margin (not transform) so it won't fight 'fall'. */
        @keyframes sway {
          0%, 100% { margin-left: -10px; }
          50%      { margin-left: 10px; }
        }
        .bead {
          position: absolute;
          top: -20px;
          border-radius: 50%;
          /* Faceted crystal bead built from layered gradients (top layer drawn first):
             1) bright highlight, 2) angular facets catching light, 3) aurora rainbow sheen,
             4) the bead colour with a dark rim for roundness. */
          background:
            radial-gradient(circle at 32% 26%,
              rgba(255,255,255,0.98) 0%, rgba(255,255,255,0) 28%),
            conic-gradient(from 35deg,
              rgba(255,255,255,0.45) 0deg,
              rgba(255,255,255,0.04) 38deg,
              rgba(0,0,0,0.20) 92deg,
              rgba(255,255,255,0.32) 150deg,
              rgba(255,255,255,0.04) 205deg,
              rgba(0,0,0,0.20) 268deg,
              rgba(255,255,255,0.40) 322deg,
              rgba(255,255,255,0.04) 360deg),
            radial-gradient(circle at 72% 78%,
              rgba(120,225,255,0.55) 0%, rgba(180,140,255,0.30) 55%, rgba(0,0,0,0) 75%),
            radial-gradient(circle at 50% 50%,
              var(--bead) 55%, rgba(0,0,0,0.30) 100%);
          box-shadow:
            inset -1px -1px 3px rgba(0,0,0,0.25),
            inset 2px 2px 5px rgba(255,255,255,0.55),
            0 0 9px rgba(150,220,255,0.35);
          animation-name: fall, sway;
          animation-timing-function: linear, ease-in-out;
          animation-iteration-count: infinite, infinite;
          will-change: transform;
        }
        /* Tiny sparkle glint on each bead. */
        .bead::after {
          content: "";
          position: absolute;
          top: 16%;
          left: 22%;
          width: 28%;
          height: 28%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0) 70%);
        }
      `}</style>

      <div className="absolute inset-0 bg-black/55" />

      {beads.map((b) => (
        <div
          key={b.id}
          className="bead"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            "--bead": b.color,
            animationDuration: `${b.duration}s, ${b.sway}s`,
            animationDelay: `${b.delay}s, ${b.delay}s`,
          }}
        />
      ))}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-24 px-6 md:px-12">

        <motion.p
          className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[6px] uppercase text-white/40 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          The maker behind the craft
        </motion.p>

        <motion.h1
          className="font-['Dorsa'] text-[clamp(80px,14vw,180px)] tracking-[0.1em] leading-none text-white mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          ABOUT ME
        </motion.h1>

        <motion.div
          className="w-24 h-[2px] bg-white/30 mb-16"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        />

        <div className="max-w-[960px] w-full grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] gap-0">

          <motion.div
            className="flex flex-col justify-center items-center md:items-end pr-0 md:pr-12 pb-12 md:pb-0"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-['Dorsa'] text-[clamp(48px,6vw,80px)] tracking-[0.08em] leading-none text-white mb-4 text-center md:text-right">
              Hi, I'm<br />Darina!
            </h2>
            <p className="font-['Centaur'] text-[16px] tracking-[3px] text-white/50 uppercase text-center md:text-right">
              Maker · Designer · Artist
            </p>
          </motion.div>

          <motion.div
            className="hidden md:block w-[2px] bg-white/15 mx-0"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ originY: 0 }}
          />

          <motion.div
            className="flex flex-col gap-6 pl-0 md:pl-12"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {[
              "In a world full of fast fashion and mass-produced accessories, I've always found myself looking for something different — something with a soul. That's why I started creating handmade bags.",
              "For me, a bag isn't just an item to carry your essentials; it's a statement of who you are. I pour my time, energy, and vision into crafting unique pieces that help you stand out and express your individuality.",
              "Every bag tells a story of patience, creativity, and conscious craftsmanship. Thank you for choosing to wear something made with love and purpose!",
            ].map((text, i) => (
              <motion.p
                key={i}
                className="font-['Centaur'] text-[clamp(17px,1.4vw,22px)] tracking-[0.08em] leading-relaxed text-white/80"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + i * 0.12 }}
              >
                {text}
              </motion.p>
            ))}
          </motion.div>
        </div>



      </div>
    </div>
  );
}
