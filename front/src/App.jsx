import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Header from "./shared/ui/Header";
import Footer from "./shared/ui/Footer";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import BeadedBagsPage from "./pages/beaded-bags/BeadedBagsPage";
import BraceletsPage from "./pages/bracelets/BraceletsPage";
import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";
import LoginPage from "./pages/login/LoginPage";
import CartPage from "./pages/cart/CartPage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import AdminPage from "./pages/admin/AdminPage";
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/legal/TermsOfServicePage";
import { API } from "./api";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem("token"));
      setUser(readUser());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let active = true;
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [token]);

  const isManager = user?.role === "manager" || user?.role === "admin";

  return (
    <CartProvider token={token}>
      <BrowserRouter>
          <Header token={token} setToken={setToken} setUser={setUser} user={user} />

          <div>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/beaded-bags" element={<BeadedBagsPage />} />
              <Route path="/bracelets" element={<BraceletsPage />} />

              <Route path="/custom-studio" element={<CustomStudioPage />} />
              <Route path="/login" element={<LoginPage setToken={setToken} setUser={setUser} />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route
                path="/admin"
                element={isManager ? <AdminPage token={token} /> : <Navigate to="/login" replace />}
              />
            </Routes>
          </div>

          <Footer />
        </BrowserRouter>
      </CartProvider>
  );
}

export default App;
