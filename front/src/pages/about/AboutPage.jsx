import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import bgImage from "./BACKGROUDN.png";

const BEAD_COLORS = ["#FFFFFF", "#F5EFE8", "#E5D9C5", "#FFC0CB", "#A9A9A9", "#050000"];

export default function AboutPage() {
  const [beads, setBeads] = useState([]);

  useEffect(() => {
    setBeads(
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: Math.random() * 5 + 5,
        delay: Math.random() * 6,
        size: Math.random() * 10 + 6,
        color: BEAD_COLORS[Math.floor(Math.random() * BEAD_COLORS.length)],
      }))
    );
  }, []);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20vh) rotate(0deg);   opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
        .bead {
          position: absolute;
          top: -20px;
          border-radius: 50%;
          box-shadow: inset -2px -2px 4px rgba(0,0,0,0.45), 1px 1px 3px rgba(255,255,255,0.45);
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
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
            backgroundColor: b.color,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
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
