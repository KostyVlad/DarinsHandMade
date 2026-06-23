import { createContext, useContext, useState, useEffect, useRef } from "react";
import { API } from "../api";

const CartContext = createContext();
const GUEST_KEY = "guestCart";

function loadGuestCart() {
    try {
        return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveGuestCart(items) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function CartProvider({ children, token }) {
    const [items, setItems] = useState([]);
    const prevToken = useRef(null);

    const fetchCart = async () => {
        if (!token) {
            setItems(loadGuestCart());
            return;
        }
        try {
            const res = await fetch(`${API}/api/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setItems(data.data.items.map((item) => ({
                    id: item.product._id,
                    name: item.product.model_name,
                    category: item.product.category,
                    image: `${API}/${item.product.file_name.replace(/^\//, '')}`,
                    price: item.product.price || 120,
                    quantity: item.quantity,
                })));
            }
        } catch (error) {
            console.error("Cart loading error:", error);
        }
    };

    useEffect(() => {
        const run = async () => {
            if (token && !prevToken.current) {
                const guestItems = loadGuestCart();
                if (guestItems.length > 0) {
                    await Promise.all(
                        guestItems.flatMap((item) =>
                            Array.from({ length: item.quantity }, () =>
                                fetch(`${API}/api/cart`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ productId: item.id }),
                                }).catch(() => {})
                            )
                        )
                    );
                    localStorage.removeItem(GUEST_KEY);
                }
            }
            prevToken.current = token;
            fetchCart();
        };
        run();
    }, [token]);

    const addToCart = async (product) => {
        if (!token) {
            const guest = loadGuestCart();
            const existing = guest.find((i) => i.id === product._id);
            if (existing) {
                existing.quantity += 1;
            } else {
                guest.push({
                    id: product._id,
                    name: product.model_name,
                    category: product.category,
                    image: `${API}/${String(product.file_name || "").replace(/^\//, "")}`,
                    price: product.price || 120,
                    quantity: 1,
                });
            }
            saveGuestCart(guest);
            setItems([...guest]);
            return;
        }
        try {
            const res = await fetch(`${API}/api/cart`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: product._id }),
            });
            const data = await res.json();
            if (res.ok) {
                fetchCart();
            } else {
                console.error("Server response:", data);
                alert(`Failed to add: ${data.msg || "Server error"}`);
            }
        } catch (error) {
            console.error("Add to cart error:", error);
        }
    };

    const removeFromCart = async (productId) => {
        if (!token) {
            const guest = loadGuestCart().filter((i) => i.id !== productId);
            saveGuestCart(guest);
            setItems(guest);
            return;
        }
        try {
            const res = await fetch(`${API}/api/cart/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchCart();
        } catch (error) {
            console.error("Remove from cart error:", error);
        }
    };

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        const updated = items.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        );
        setItems(updated);
        if (!token) saveGuestCart(updated);
    };

    const clearCart = () => {
        setItems([]);
        if (!token) localStorage.removeItem(GUEST_KEY);
    };

    const getTotalPrice = () =>
        items.reduce((total, item) => total + item.price * item.quantity, 0);

    const getTotalItems = () =>
        items.reduce((total, item) => total + item.quantity, 0);

    const addCustomItem = (item) => {
        const updated = [...items, item];
        setItems(updated);
        if (!token) saveGuestCart(updated);
    };

    return (
        <CartContext.Provider value={{ items, addToCart, addCustomItem, removeFromCart, updateQuantity, getTotalPrice, clearCart, getTotalItems }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
