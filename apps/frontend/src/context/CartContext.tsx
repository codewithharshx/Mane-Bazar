import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import toast from "react-hot-toast";
import useLocalStorage from "../hooks/useLocalStorage";

interface CartItem {
  _id: string;
  id?: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  qty: number;
  stock: number;
  slug: string;
  brand: string;
}

interface Coupon {
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  cartCount: number;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addToCart: (product: any, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const getProductId = (product: any): string =>
  String(product?.id || product?._id || "");

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>("mane-bazar-cart", []);
  const [coupon, setCoupon] = useLocalStorage<Coupon | null>("mane-bazar-coupon", null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const addToCart = (product: any, qty = 1) => {
    const id = getProductId(product);
    if (!id) return;
    if (product.stock < 1) {
      toast.error("This product is out of stock");
      return;
    }
    setCartItems((current) => {
      const existing = current.find((item) => (item.id || item._id) === id);
      if (existing) {
        const updatedQty = Math.min(existing.qty + qty, product.stock);
        return current.map((item) =>
          (item.id || item._id) === id ? { ...item, qty: updatedQty } : item
        );
      }
      return [
        ...current,
        {
          _id: id,
          id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          image: product.images?.[0] || product.image || "",
          qty,
          stock: product.stock,
          slug: product.slug,
          brand: product.brand,
        } as any,
      ];
    });
    toast.success("Added to cart");
    setDrawerOpen(true);
  };

  const updateQty = (productId: string, qty: number) => {
    const targetId = String(productId || "");
    setCartItems((current) =>
      current
        .map((item) =>
          (item.id || item._id) === targetId
            ? { ...item, qty: Math.max(0, Math.min(qty, item.stock)) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    const targetId = String(productId || "");
    setCartItems((current) => current.filter((item) => (item.id || item._id) !== targetId));
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
      removeCoupon: () => setCoupon(null),
    }),
    [cartItems, coupon, subtotal, isDrawerOpen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
