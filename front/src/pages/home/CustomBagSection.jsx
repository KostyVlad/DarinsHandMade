import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import skyBag from "./assets/skyCustomBagSection.png";
import blueBag from "./assets/blueCustomSectionbag.png";
import greenBag from "./assets/greenCustomSectionbag.png";
import pinkBag from "./assets/pinkCustomSectionbag.png";
import purpleBag from "./assets/purpleCustomSectionbag.png";

const bagOptions = [
  { color: "#25cfff", image: skyBag },
  { color: "#2d46ff", image: blueBag },
  { color: "#39c24a", image: greenBag },
  { color: "#ff00f5", image: pinkBag },
  { color: "#8d47ff", image: purpleBag },
];

function CustomBagSection() {
  const [selected, setSelected] = useState(0);
  const [createHovered, setCreateHovered] = useState(false);

  return (
    <section className="w-full bg-black">
      <div className="mx-auto flex flex-col md:flex-row items-center md:justify-between max-w-[1512px] px-[20px] md:px-[50px] py-[40px]">
        <motion.div
          className="w-full md:w-[42%] flex flex-col items-center md:items-start text-center md:text-left"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="m-0 text-white text-[60px] md:text-[150px] leading-[0.78] tracking-[0.18em]"
            style={{ fontFamily: "Dorsa, sans-serif" }}
          >
            CREATE YOUR OWN DESIGN
          </h2>

          <p
            className="mt-[30px] md:mt-[50px] max-w-[560px] text-center text-white text-[20px] md:text-[32px] leading-[1.45] tracking-[0.12em]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Choose the shape, color, and type of beads. Create a unique
            accessory that fits you perfectly.
          </p>

          <motion.div className="mt-[42px]">
            <Link
              to="/custom-studio"
              onMouseEnter={() => setCreateHovered(true)}
              onMouseLeave={() => setCreateHovered(false)}
            >
              <motion.div
                className="relative inline-flex h-[76px] w-[320px] items-center justify-center rounded-full bg-white text-black text-[36px] tracking-[0.16em] overflow-hidden cursor-pointer"
                style={{ fontFamily: "Cormorant Garamond, serif" }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full bg-black/8"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={createHovered ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className="relative z-10 flex items-center gap-3"
                  animate={createHovered ? { letterSpacing: "0.26em" } : { letterSpacing: "0.16em" }}
                  transition={{ duration: 0.3 }}
                >
                  CREATE
                  <motion.span
                    animate={createHovered ? { x: 6, opacity: 1 } : { x: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[22px]"
                  >
                    →
                  </motion.span>
                </motion.span>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        <div className="flex w-full md:w-[10%] flex-row md:flex-col items-center justify-center gap-[24px] my-8 md:my-0">
          {bagOptions.map((item, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="h-[48px] w-[48px] rounded-full cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: item.color,
                border: selected === i ? "4px solid white" : "2px solid rgba(255,255,255,0.4)",
                boxShadow: selected === i ? `0 0 16px ${item.color}99` : "none",
              }}
              aria-label={`Select bag color ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex w-full md:w-[38%] justify-center md:justify-end">
          <AnimatePresence mode="wait">
            <motion.img
              key={selected}
              src={bagOptions[selected].image}
              alt="Handmade beaded bag"
              className="w-full max-w-[470px] object-contain"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default CustomBagSection;
