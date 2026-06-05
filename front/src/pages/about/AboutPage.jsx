import { useEffect, useState } from "react";

export default function AboutPage() {
  const [beads, setBeads] = useState([]);

  useEffect(() => {
    const colors = ["#FFFFFF", "#F5EFE8", "#E5D9C5", "#FFC0CB", "#A9A9A9", "#050000"];

    const newBeads = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 5 + 4,
      animationDelay: Math.random() * 4,
      size: Math.random() * 12 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setBeads(newBeads);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f3f3f1] overflow-hidden flex items-center justify-center py-20 px-4 md:px-8">
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.8; }
            100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
          }
          .falling-bead {
            position: absolute;
            top: -20px;
            border-radius: 50%;
            box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2), 1px 1px 3px rgba(255,255,255,0.9);
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        `}
      </style>

      {beads.map((bead) => (
        <div
          key={bead.id}
          className="falling-bead"
          style={{
            left: `${bead.left}%`,
            width: `${bead.size}px`,
            height: `${bead.size}px`,
            backgroundColor: bead.color,
            animationDuration: `${bead.animationDuration}s`,
            animationDelay: `${bead.animationDelay}s`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-[900px] w-full bg-white/70 backdrop-blur-md p-10 md:p-16 border border-black/10 shadow-xl text-center">
        <h1 className="font-['Dorsa:Regular',sans-serif] text-[100px] md:text-[140px] tracking-[15.12px] leading-none text-black mb-6">
          ABOUT ME
        </h1>

        <h2 className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[24px] tracking-[4.32px] text-black mb-10">
          Hi, I’m Darina!
        </h2>

        <div className="space-y-6 font-['Centaur:Regular',sans-serif] text-[#333] text-[20px] md:text-[24px] tracking-[2.16px] leading-relaxed text-justify md:text-center">
          <p>
            In a world full of fast fashion and mass-produced accessories, I’ve always found myself looking for something different—something with a soul. That’s why I started creating handmade bags.
          </p>
          <p>
            For me, a bag isn’t just an item to carry your essentials; it’s a statement of who you are. While the world rushes toward quick, mindless trends, I want to slow things down and focus on the details. I pour my time, energy, and vision into crafting unique pieces that help you stand out, express your individuality, and add that perfect, personal touch to your everyday style.
          </p>
          <p>
            Every bag tells a story of patience, creativity, and conscious craftsmanship. Thank you for choosing to wear something made with love and purpose!
          </p>
        </div>
      </div>
    </div>
  );
}