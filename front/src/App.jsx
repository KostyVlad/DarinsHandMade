import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./shared/ui/Header";
import Footer from "./shared/ui/Footer";
import LoginPage from "./pages/login/LoginPage";
import CartPage from "./pages/cart/CartPage";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import BeadedBagsPage from "./pages/beaded-bags/BeadedBagsPage";
import BraceletsPage from "./pages/bracelets/BraceletsPage";
import EmbroideryPage from "./pages/embroidery/EmbroideryPage";
import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  return (
    <BrowserRouter>
      <Header token={token} setToken={setToken} />
      <div className="pt-[120px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/beaded-bags" element={<BeadedBagsPage />} />
          <Route path="/bracelets" element={<BraceletsPage />} />
          <Route path="/embroidery" element={<EmbroideryPage />} />
          <Route path="/custom-studio" element={<CustomStudioPage />} />
          <Route path="/login" element={<LoginPage setToken={setToken} />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}

export default App;