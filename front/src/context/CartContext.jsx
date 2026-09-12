import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { imageUrl, authHeader } from '../api';

// A context lets every page read the cart without passing it down as a prop.
const CartContext = createContext();

const CartProvider = ({ children, token }) => {
  const [items, setItems] = useState([]);

  // Reads the cart of the logged in user from the server.
  const fetchCart = () => {
    if (!token) {
      setItems([]);
      return;
    }

    api
      .get('/api/cart', authHeader(token))
      .then((response) => {
        // The server sends the products inside the items, so here we only
        // turn them into the simple shape that the pages display.
        const cartItems = response.data.data.items.map((item) => ({
          id: item.product._id,
          name: item.product.model_name,
          category: item.product.category,
          image: imageUrl(item.product.file_name),
          price: item.product.price,
          quantity: item.quantity,
        }));
        setItems(cartItems);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Runs on the first render and again every time the user logs in or out.
  useEffect(() => {
    fetchCart();
  }, [token]);

  const addToCart = (product) => {
    if (!token) {
      alert('Please sign in to add items to your cart!');
      return;
    }

    api
      .post('/api/cart', { productId: product._id }, authHeader(token))
      .then(() => {
        fetchCart();
      })
      .catch((error) => {
        console.log(error);
        alert('Failed to add to cart');
      });
  };

  const removeFromCart = (productId) => {
    api
      .delete(`/api/cart/${productId}`, authHeader(token))
      .then(() => {
        fetchCart();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // A bag built in the Custom Studio is not a product from the catalog,
  // so it is kept in the cart of this browser only.
  const addCustomItem = (item) => {
    setItems((prev) => [...prev, item]);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addCustomItem,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        clearCart,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Short way for a page to read the cart: const { items } = useCart();
const useCart = () => useContext(CartContext);

export { CartProvider, useCart };
