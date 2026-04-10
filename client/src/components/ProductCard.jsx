import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/formatters";

const animateToCart = (imageSrc, event) => {
  const cartTarget = document.getElementById("cart-badge-anchor");
  const source = event?.currentTarget?.closest("[data-product-card]");
  if (!cartTarget || !source) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = cartTarget.getBoundingClientRect();
  const flyer = document.createElement("img");

  flyer.src = imageSrc;
  flyer.style.position = "fixed";
  flyer.style.left = `${sourceRect.left + sourceRect.width / 2 - 24}px`;
  flyer.style.top = `${sourceRect.top + 24}px`;
  flyer.style.width = "48px";
  flyer.style.height = "48px";
  flyer.style.borderRadius = "999px";
  flyer.style.zIndex = "999";
  flyer.style.pointerEvents = "none";
  flyer.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.18)";
  document.body.appendChild(flyer);

  flyer.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      {
        transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.35)`,
        opacity: 0.2
      }
    ],
    { duration: 500, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
  ).onfinish = () => flyer.remove();
};

const ProductCard = ({ product, onQuickView, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  return (
    <motion.div
      data-product-card
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => toggleWishlist(product)}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow"
      >
        <span className={isWishlisted(product._id) ? "text-rose-500" : "text-slate-400"}>
          ♥
        </span>
      </button>
      <Link to={`/products/${product.slug}`}>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 to-orange-50">
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </div>
      </Link>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700">
            {product.brand}
          </p>
          {product.stock < 1 ? (
            <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">
              Out of Stock
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              {product.discount}% off
            </span>
          )}
        </div>
        <Link to={`/products/${product.slug}`} className="block">
          <h3 className="min-h-[3.5rem] text-lg font-semibold text-slate-900">{product.name}</h3>
        </Link>
        <p className="min-h-[2.5rem] text-sm text-slate-500">{product.description}</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
            <p className="text-sm text-slate-400 line-through">{formatCurrency(product.mrp)}</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => onQuickView(product)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Quick View
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              disabled={product.stock < 1}
              onClick={(event) => {
                addToCart(product, 1);
                animateToCart(product.images?.[0], event);
              }}
              className="rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
