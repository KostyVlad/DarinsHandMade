import Header from "../../shared/ui/Header";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <HeroSection />
      <AboutSection />
    </div>
  );
}

export default HomePage;