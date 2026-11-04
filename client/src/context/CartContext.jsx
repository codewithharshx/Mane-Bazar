import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import useLocalStorage from "../hooks/useLocalStorage";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useLocalStorage("mane-bazar-cart", []);
  const [coupon, setCoupon] = useLocalStorage("mane-bazar-coupon", null);

  // FIX: Drawer open state is UI-only — should NOT persist to localStorage.
  // Using localStorage previously caused the drawer to reopen on every page load.
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const addToCart = (product, qty = 1) => {
    if (product.stock < 1) {
      toast.error("This product is out of stock");
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item._id === product._id);
      if (existing) {
        const updatedQty = Math.min(existing.qty + qty, product.stock);
        return current.map((item) =>
          item._id === product._id ? { ...item, qty: updatedQty } : item
        );
      }

      return [
        ...current,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          image: product.images?.[0] || "",
          qty,
          stock: product.stock,
          slug: product.slug,
          brand: product.brand
        }
      ];
    });

    toast.success("Added to cart");
    setDrawerOpen(true);
  };

  const updateQty = (productId, qty) => {
    setCartItems((current) =>
      current
        .map((item) =>
          item._id === productId
            ? { ...item, qty: Math.max(1, Math.min(qty, item.stock)) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((current) => current.filter((item) => item._id !== productId));
    toast.success("Removed from cart");
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setDrawerOpen(false);
  };

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      coupon,
      subtotal,
      cartCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      isDrawerOpen,
      setDrawerOpen,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      applyCoupon: setCoupon,
      removeCoupon: () => setCoupon(null)
    }),
    [cartItems, coupon, subtotal, isDrawerOpen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
};
