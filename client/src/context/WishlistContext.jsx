import { createContext, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import useLocalStorage from "../hooks/useLocalStorage";

const WishlistContext = createContext(null);

/**
 * WishlistProvider stores only the minimal required fields per product.
 * Storing the full product object would bloat localStorage (images, descriptions, etc.)
 * and cause stale data when products are updated server-side.
 */
const SLIM_FIELDS = ["_id", "name", "price", "mrp", "slug", "images", "brand", "stock"];

const slimProduct = (product) =>
  SLIM_FIELDS.reduce((acc, key) => {
    if (product[key] !== undefined) acc[key] = product[key];
    return acc;
  }, {});

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useLocalStorage("mane-bazar-wishlist", []);

  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    if (exists) {
      setWishlist((current) => current.filter((item) => item._id !== product._id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist((current) => [...current, slimProduct(product)]);
      toast.success("Added to wishlist");
    }
  };

  const value = useMemo(
    () => ({
      wishlist,
      toggleWishlist,
      isWishlisted: (productId) => wishlist.some((item) => item._id === productId)
    }),
    [wishlist] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
};
