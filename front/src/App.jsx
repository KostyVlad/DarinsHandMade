import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./shared/ui/Header";
import Footer from "./shared/ui/Footer";

import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import BeadedBagsPage from "./pages/beaded-bags/BeadedBagsPage";
import BraceletsPage from "./pages/bracelets/BraceletsPage";
import EmbroideryPage from "./pages/crochet-wear/EmbroideryPage";
import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <div className="pt-[120px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/beaded-bags" element={<BeadedBagsPage />} />
          <Route path="/bracelets" element={<BraceletsPage />} />
          <Route path="/embroidery" element={<EmbroideryPage />} />
          <Route path="/custom-studio" element={<CustomStudioPage />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}

export default App;