import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import PageTransition from "../components/PageTransition";
import { formatCurrency } from "../utils/formatters";
import ProductImage from "../components/ProductImage";

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <PageTransition className="section-shell py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Saved items</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Your Wishlist</h1>
        <p className="mt-1 text-slate-500">{wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white/70 py-20 text-center shadow-soft backdrop-blur-md">
          <span className="text-6xl">🤍</span>
          <h2 className="mt-5 text-2xl font-bold text-slate-800">Nothing saved yet</h2>
          <p className="mt-2 max-w-xs text-slate-400">
            Browse products and tap the heart icon to save items here for later.
          </p>
          <Link to="/products" className="gradient-button mt-8">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product) => (
            <div key={product._id} className="card-surface flex flex-col overflow-hidden">
              {/* Image */}
              <Link to={`/products/${product.slug}`} className="block">
                <ProductImage
                  product={product}
                  alt={product.name}
                  containerClassName="h-48"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </Link>

              <div className="flex flex-1 flex-col p-4 gap-3">
                <div className="flex-1">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-bold text-slate-900 hover:text-green-700 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">{product.brand}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.mrp > product.price && (
                      <span className="ml-2 text-xs text-slate-400 line-through">
                        {formatCurrency(product.mrp)}
                      </span>
                    )}
                  </div>
                  {product.discount > 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {product.discount}% off
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="gradient-button flex-1 justify-center py-2.5 text-sm"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    ♥
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};

export default WishlistPage;
