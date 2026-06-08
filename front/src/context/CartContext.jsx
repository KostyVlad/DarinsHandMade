import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children, token }) {
    const [items, setItems] = useState([]);

    const fetchCart = async () => {
        if (!token) {
            setItems([]);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/cart", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success && data.data) {
                const formattedItems = data.data.items.map((item) => ({
                    id: item.product._id,
                    name: item.product.model_name,
                    category: item.product.category,
                    image: `http://localhost:5000/${item.product.file_name.replace(/^\//, '')}`,
                    price: item.product.price || 120,
                    quantity: item.quantity,
                }));
                setItems(formattedItems);
            }
        } catch (error) {
            console.error("Cart loading error:", error);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [token]);

    const addToCart = async (product) => {
        if (!token) {
            alert("Please sign in to add items to your cart!");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/cart", {
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
        try {
            const res = await fetch(`http://localhost:5000/api/cart/${productId}`, {
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
        setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    };

    const clearCart = () => setItems([]);

    const getTotalPrice = () => {
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getTotalItems = () => {
        return items.reduce((total, item) => total + item.quantity, 0);
    };

    const addCustomItem = (item) => {
        setItems((prev) => [...prev, item]);
    };

    return (
        <CartContext.Provider value={{ items, addToCart, addCustomItem, removeFromCart, updateQuantity, getTotalPrice, clearCart, getTotalItems }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);