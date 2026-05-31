import { useRef } from "react";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import CustomBagSection from "./CustomBagSection";
import CategoriesSection from "./CategoriesSection";
import "./HomePage.css";

function HomePage() {
    const categoriesRef = useRef(null);

    const handleScrollToCategories = () => {
        categoriesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <div className="home-page">
            <HeroSection onShopClick={handleScrollToCategories} />
            <AboutSection />
            <CustomBagSection />
            <CategoriesSection categoriesRef={categoriesRef} />
        </div>
    );
}

export default HomePage;