import { Link } from "react-router-dom";
import rectangleWithBag from "./assets/RectangleWithbag.png";
import rectangleBracelets from "./assets/RectangleBracelets.png";
import rectangleCroachetWear from "./assets/RectangleCroachetWear.png";

function CategoriesSection({ categoriesRef }) {
    const categories = [
        {
            title: "Beaded Bags",
            image: rectangleWithBag,
            link: "/beaded-bags",
        },
        {
            title: "Bracelets",
            image: rectangleBracelets,
            link: "/bracelets",
        },
        {
            title: "Crochet Wear",
            image: rectangleCroachetWear,
            link: "/crochet-wear",
        },
    ];

    return (
        <section ref={categoriesRef} className="categories-section w-full bg-black">
            <div className="mx-auto grid max-w-[1512px] grid-cols-1 gap-[20px] px-[20px] py-[40px] md:grid-cols-3">
                {categories.map((item, index) => (
                    <Link
                        key={index}
                        to={item.link}
                        className="group relative block h-[620px] overflow-hidden no-underline"
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />

                        <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/20" />

                        <h3
                            className="absolute left-1/2 top-[38px] w-full -translate-x-1/2 px-[20px] text-center text-white text-[64px] leading-[1] tracking-[0.18em]"
                            style={{ fontFamily: "Dorsa, sans-serif" }}
                        >
                            {item.title}
                        </h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default CategoriesSection;