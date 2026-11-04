import { createContext, useContext, useMemo, ReactNode } from "react";
import toast from "react-hot-toast";
import useLocalStorage from "../hooks/useLocalStorage";

interface WishlistItem {
  _id: string;
  id?: string;
  name: string;
  price: number;
  mrp: number;
  slug: string;
  images: string[];
  image?: string;
  brand: string;
  stock: number;
}

interface WishlistContextValue {
  wishlist: WishlistItem[];
  toggleWishlist: (product: any) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const getProductId = (product: any): string =>
  String(product?.id || product?._id || "");

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useLocalStorage<WishlistItem[]>("mane-bazar-wishlist", []);

  const toggleWishlist = (product: any) => {
    const targetId = getProductId(product);
    if (!targetId) return;

    const exists = wishlist.some((item) => (item.id || item._id) === targetId);
    if (exists) {
      setWishlist((current) => current.filter((item) => (item.id || item._id) !== targetId));
      toast.success("Removed from wishlist");
    } else {
      const itemToSave: WishlistItem = {
        _id: targetId,
        id: targetId,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        slug: product.slug,
        images: product.images || (product.image ? [product.image] : []),
        image: product.image || product.images?.[0] || "",
        brand: product.brand || "Mane Bazar",
        stock: product.stock || 0,
      };
      setWishlist((current) => [...current, itemToSave]);
      toast.success("Added to wishlist");
    }
  };

  const value = useMemo(
    () => ({
      wishlist,
      toggleWishlist,
      isWishlisted: (productId: string) => {
        const targetId = String(productId || "");
        return wishlist.some((item) => (item.id || item._id) === targetId);
      },
    }),
    [wishlist] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
};
