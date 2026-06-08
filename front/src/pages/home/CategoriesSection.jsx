import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import rectangleWithBag from "./assets/RectangleWithbag.png";
import rectangleBracelets from "./assets/RectangleBracelets.png";

function CategoriesSection({ categoriesRef }) {
  const categories = [
    { title: "Beaded Bags", image: rectangleWithBag, link: "/beaded-bags" },
    { title: "Bracelets",   image: rectangleBracelets, link: "/bracelets" },
  ];

  return (
    <section ref={categoriesRef} className="w-full bg-black">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-[20px] px-[20px] py-[40px] md:grid-cols-2">
        {categories.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={item.link}
              className="group relative block h-[620px] overflow-hidden no-underline"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />

              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500" />

              <h3
                className="absolute left-1/2 top-[38px] w-full -translate-x-1/2 px-[20px] text-center text-white text-[64px] leading-[1] tracking-[0.18em] transition-transform duration-500 group-hover:-translate-y-2 group-hover:left-1/2"
                style={{ fontFamily: "Dorsa, sans-serif" }}
              >
                {item.title}
              </h3>

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-10 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="w-12 h-[1px] bg-white/60 mb-4" />
                <span
                  className="text-white text-[14px] tracking-[4px] uppercase"
                  style={{ fontFamily: "Perpetua Titling MT, serif" }}
                >
                  Explore →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default CategoriesSection;
