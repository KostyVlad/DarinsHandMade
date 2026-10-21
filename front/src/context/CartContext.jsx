import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { imageUrl, authHeader } from '../api';

// A context lets every page read the cart without passing it down as a prop.
const CartContext = createContext();

// A visitor who is not signed in still gets a cart; it lives in this browser.
const GUEST_KEY = 'guestCart';

const loadGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
};

const saveGuestCart = (items) => {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
};

// A bag from the Custom Studio is not a product from the catalog, so the
// server cart cannot hold it. For a signed in user it lives in this browser.
const CUSTOM_KEY = 'customItems';

const loadCustomItems = () => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
  } catch {
    return [];
  }
};

const saveCustomItems = (items) => {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(items));
};

// Custom bags get an id like "custom-1718000000000".
const isCustom = (id) => String(id).startsWith('custom-');

// Turns one row of the server cart into the simple shape the pages display.
const toCartItem = (item) => ({
  id: item.product._id,
  name: item.product.model_name,
  category: item.product.category,
  image: imageUrl(item.product.file_name),
  price: item.product.price,
  quantity: item.quantity
});

const CartProvider = ({ children, token }) => {
  const [items, setItems] = useState([]);

  // Remembers the previous token, so we can tell a fresh login from a redraw.
  const prevToken = useRef(null);

  // Signed in: read the cart from the server. Guest: read it from this browser.
  const fetchCart = () => {
    if (!token) {
      setItems(loadGuestCart());
      return;
    }

    api
      .get('/api/cart', authHeader(token))
      .then((response) => {
        setItems([...response.data.data.items.map(toCartItem), ...loadCustomItems()]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // On the first render, and again whenever the user logs in or out.
  useEffect(() => {
    const justLoggedIn = token && !prevToken.current;
    prevToken.current = token;

    if (!justLoggedIn) {
      fetchCart();
      return;
    }

    // The visitor filled a cart before logging in, so move it to the server.
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) {
      fetchCart();
      return;
    }

    // Custom bags cannot go to the server, so they move to their own list.
    const customItems = guestItems.filter((item) => isCustom(item.id));
    saveCustomItems([...loadCustomItems(), ...customItems]);

    // One request per unit, because the server adds one item at a time.
    const products = guestItems.filter((item) => !isCustom(item.id));
    const requests = products.flatMap((item) =>
      Array.from({ length: item.quantity }, () =>
        api.post('/api/cart', { productId: item.id }, authHeader(token))
      )
    );

    Promise.allSettled(requests).then(() => {
      localStorage.removeItem(GUEST_KEY);
      fetchCart();
    });
  }, [token]);

  const addToCart = (product) => {
    if (!token) {
      const guest = loadGuestCart();
      const existing = guest.find((item) => item.id === product._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        guest.push({
          id: product._id,
          name: product.model_name,
          category: product.category,
          image: imageUrl(product.file_name),
          price: product.price,
          quantity: 1
        });
      }

      saveGuestCart(guest);
      setItems([...guest]);
      return;
    }

    api
      .post('/api/cart', { productId: product._id }, authHeader(token))
      .then(() => {
        fetchCart();
      })
      .catch((error) => {
        console.log(error);
        alert(error.response?.data?.message || 'Failed to add to cart');
      });
  };

  const removeFromCart = (productId) => {
    if (!token) {
      const guest = loadGuestCart().filter((item) => item.id !== productId);
      saveGuestCart(guest);
      setItems(guest);
      return;
    }

    if (isCustom(productId)) {
      saveCustomItems(loadCustomItems().filter((item) => item.id !== productId));
      setItems(items.filter((item) => item.id !== productId));
      return;
    }

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
  // so it is kept only in this browser.
  const addCustomItem = (item) => {
    const updated = [...items, item];
    setItems(updated);

    if (!token) {
      saveGuestCart(updated);
      return;
    }
    saveCustomItems([...loadCustomItems(), item]);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    const updated = items.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setItems(updated);

    if (!token) {
      saveGuestCart(updated);
      return;
    }

    if (isCustom(id)) {
      saveCustomItems(updated.filter((item) => isCustom(item.id)));
      return;
    }

    // The new number is already on the screen; the server keeps it for next time.
    api
      .patch(`/api/cart/${id}`, { quantity: newQuantity }, authHeader(token))
      .catch((error) => {
        console.log(error);
        fetchCart();
      });
  };

  const clearCart = () => {
    setItems([]);

    if (!token) {
      localStorage.removeItem(GUEST_KEY);
      return;
    }

    localStorage.removeItem(CUSTOM_KEY);
    api
      .delete('/api/cart', authHeader(token))
      .then(() => {
        fetchCart();
      })
      .catch((error) => {
        console.log(error);
      });
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
        getTotalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Short way for a page to read the cart: const { items } = useCart();
const useCart = () => useContext(CartContext);

export { CartProvider, useCart };
