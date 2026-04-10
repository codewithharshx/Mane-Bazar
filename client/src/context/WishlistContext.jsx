import { createContext, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import useLocalStorage from "../hooks/useLocalStorage";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useLocalStorage("mane-bazar-wishlist", []);

  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    if (exists) {
      setWishlist((current) => current.filter((item) => item._id !== product._id));
      toast.success("Removed from wishlist");
    } else {
      setWishlist((current) => [...current, product]);
      toast.success("Added to wishlist");
    }
  };

  const value = useMemo(
    () => ({
      wishlist,
      toggleWishlist,
      isWishlisted: (productId) => wishlist.some((item) => item._id === productId)
    }),
    [wishlist]
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
