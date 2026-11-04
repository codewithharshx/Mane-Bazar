import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">💚</div>
      <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">Your wishlist is empty</h2>
      <p className="text-slate-500 mb-6">Save items you love for later</p>
      <Link to="/products" className="bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-green-700 transition-colors">Browse Products</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Wishlist ({wishlist.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlist.map((item) => (
          <div key={item._id} className="bg-white rounded-2xl border border-slate-100 hover:shadow-card-hover transition-all overflow-hidden">
            <Link to={`/products/${item.slug}`}>
              <div className="aspect-square bg-slate-50">
                <img src={item.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"} alt={item.name} className="w-full h-full object-cover" />
              </div>
            </Link>
            <div className="p-3">
              <h3 className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</h3>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="font-bold text-green-700">₹{item.price}</span>
                <div className="flex gap-1">
                  <button onClick={() => addToCart({ ...item })}
                    className="w-7 h-7 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors">
                    <ShoppingCart size={12} />
                  </button>
                  <button onClick={() => toggleWishlist(item)}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors">
                    <Heart size={12} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default WishlistPage;
