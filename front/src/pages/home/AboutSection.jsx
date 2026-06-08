import { motion } from "framer-motion";
import aboutBag from "./assets/AboutSectionBag.png";

function AboutSection() {
  return (
    <section className="w-full bg-[#f3f3f1] -mt-[70px]">
      <div className="mx-auto flex max-w-[1512px] items-center justify-between px-[40px] py-[40px]">
        <motion.div
          className="w-[42%] flex justify-start"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={aboutBag}
            alt="Black handmade beaded bag"
            className="w-full max-w-[520px] object-contain"
            whileHover={{ scale: 1.03, rotate: -1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.div>

        <div className="w-[58%] flex flex-col items-center">
          <motion.h2
            className="m-0 text-black text-[138px] leading-[0.9]"
            style={{ fontFamily: "Dorsa, sans-serif" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Uniqueness in the details
          </motion.h2>

          <motion.p
            className="mt-[34px] max-w-[760px] text-center text-black text-[32px] leading-[1.4] tracking-[0.12em]"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Unique design, high-quality materials, and eye-catching details.
            A stylish accessory that stands out — for special moments or
            everyday looks.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
