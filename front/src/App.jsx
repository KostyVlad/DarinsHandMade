import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import api, { authHeader } from './api';
import { CartProvider } from './context/CartContext';

import Header from './shared/ui/Header';
import Footer from './shared/ui/Footer';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/about/AboutPage';
import BeadedBagsPage from './pages/beaded-bags/BeadedBagsPage';
import BraceletsPage from './pages/bracelets/BraceletsPage';
import CustomStudioPage from './pages/custom-studio/CustomStudioPage';
import LoginPage from './pages/login/LoginPage';
import CartPage from './pages/cart/CartPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import AdminPage from './pages/admin/AdminPage';

// Reads the saved user out of localStorage. It is wrapped in try/catch
// because localStorage holds text, and broken text would crash JSON.parse.
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(readUser);

  // The storage event fires when another browser tab logs in or out,
  // so both tabs stay on the same user.
  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem('token'));
      setUser(readUser());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Every time the token changes we ask the server who this user is, so the
  // role used by the /admin guard comes from the server and not from an old copy.
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    api
      .get('/api/auth/me', authHeader(token))
      .then((response) => {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      })
      .catch((error) => {
        console.log(error);
      });
  }, [token]);

  const isManager = user?.role === 'manager' || user?.role === 'admin';

  return (
    <CartProvider token={token}>
      <Header token={token} setToken={setToken} setUser={setUser} user={user} />

      <div>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/beaded-bags' element={<BeadedBagsPage />} />
          <Route path='/bracelets' element={<BraceletsPage />} />
          <Route path='/custom-studio' element={<CustomStudioPage />} />
          <Route path='/login' element={<LoginPage setToken={setToken} setUser={setUser} />} />
          <Route path='/cart' element={<CartPage />} />
          <Route path='/checkout' element={<CheckoutPage />} />
          <Route path='/products/:id' element={<ProductDetailPage />} />

          {/* Only a manager may open /admin. Everyone else is sent to the login page. */}
          <Route
            path='/admin'
            element={isManager ? <AdminPage token={token} /> : <Navigate to='/login' replace />}
          />
        </Routes>
      </div>

      <Footer />
    </CartProvider>
  );
};

export default App;
