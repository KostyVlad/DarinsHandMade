import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import api, { authHeader } from "./api";
import { CartProvider } from "./context/CartContext";

import Header from "./shared/ui/Header";
import Footer from "./shared/ui/Footer";
import HomePage from "./pages/home/HomePage";
import AboutPage from "./pages/about/AboutPage";
import BeadedBagsPage from "./pages/beaded-bags/BeadedBagsPage";
import BraceletsPage from "./pages/bracelets/BraceletsPage";
import CustomStudioPage from "./pages/custom-studio/CustomStudioPage";
import LoginPage from "./pages/login/LoginPage";
import ForgotPasswordPage from "./pages/login/ForgotPasswordPage";
import ResetPasswordPage from "./pages/login/ResetPasswordPage";
import CartPage from "./pages/cart/CartPage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import OrderSuccessPage from "./pages/order/OrderSuccessPage";
import AdminPage from "./pages/admin/AdminPage";
import ManagerOrdersPage from "./pages/admin/ManagerOrdersPage";
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/legal/TermsOfServicePage";

// Reads the saved user out of localStorage. It is wrapped in try/catch
// because localStorage holds text, and broken text would crash JSON.parse.
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

const App = () => {
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
    // Ask the server who this user is, so the role used by the /admin guard
    // comes from the server and not from an old copy in localStorage.
    api
      .get("/api/auth/me", authHeader(token))
      .then((response) => {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      })
      .catch((error) => {
        console.log(error);
      });
  }, [token]);

  const isManager = user?.role === "manager" || user?.role === "admin";

  return (
    <CartProvider token={token}>
      <Header token={token} setToken={setToken} setUser={setUser} user={user} />

      <div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/beaded-bags" element={<BeadedBagsPage />} />
          <Route path="/bracelets" element={<BraceletsPage />} />

          <Route path="/custom-studio" element={<CustomStudioPage />} />
          <Route path="/login" element={<LoginPage setToken={setToken} setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route
            path="/admin"
            element={isManager ? <AdminPage token={token} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin/orders"
            element={isManager ? <ManagerOrdersPage token={token} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>

      <Footer />
    </CartProvider>
  );
};

export default App;
