import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/formatters";
import ProductImage from "./ProductImage";
import { getProductImage } from "../utils/productImage";

/* ── Fly-to-cart animation ───────────────────────────────────────── */
const animateToCart = (imageSrc, event) => {
  const cartTarget = document.getElementById("cart-badge-anchor");
  const source = event?.currentTarget?.closest("[data-product-card]");
  if (!cartTarget || !source) return;

  const sourceRect = source.getBoundingClientRect();
  const targetRect = cartTarget.getBoundingClientRect();
  const flyer = document.createElement("img");
  flyer.src = imageSrc;
  Object.assign(flyer.style, {
    position: "fixed",
    left: `${sourceRect.left + sourceRect.width / 2 - 24}px`,
    top: `${sourceRect.top + 40}px`,
    width: "48px", height: "48px",
    borderRadius: "999px",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)"
  });
  document.body.appendChild(flyer);

  flyer.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.25)`,
        opacity: 0
      }
    ],
    { duration: 500, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
  ).onfinish = () => flyer.remove();
};

/* ── Heart icon ─────────────────────────────────────────────────── */
const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/* ── Plus / Minus ────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ProductCard = ({ product, onQuickView, index = 0 }) => {
  const { addToCart, cartItems, updateQty } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const wishlisted = isWishlisted(product._id);
  const inCart = cartItems.find((i) => i._id === product._id);
  const qty = inCart?.qty || 0;
  const outOfStock = product.stock < 1;
  const discount = product.discount || 0;
  const imageSrc = getProductImage(product);

  const handleAdd = (e) => {
    addToCart(product, 1);
    animateToCart(imageSrc, e);
  };

  return (
    <motion.div
      data-product-card
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="product-card group flex flex-col"
    >
      {/* ── Image area ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-t-3xl bg-slate-50">
        {/* Discount badge */}
        {discount > 0 && !outOfStock && (
          <div className="offer-tag">{discount}% OFF</div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-t-3xl bg-slate-900/50 backdrop-blur-sm">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleWishlist(product)}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
            wishlisted
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-slate-400 hover:bg-white hover:text-rose-400"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon filled={wishlisted} />
        </motion.button>

        {/* Quick view button — shows on hover */}
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-slate-900/80 px-4 py-1.5 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 backdrop-blur-sm"
          >
            Quick View
          </button>
        )}

        <Link to={`/products/${product.slug}`}>
          <ProductImage
            product={product}
            alt={product.name}
            containerClassName="aspect-[4/3]"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* ── Details ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Brand */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-green-600 truncate">
          {product.brand}
        </p>

        {/* Name */}
        <Link to={`/products/${product.slug}`} className="block flex-1">
          <h3
            className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 hover:text-green-700 transition-colors"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Weight/quantity */}
        {product.unit && (
          <p className="text-xs text-slate-400 font-medium">{product.unit}</p>
        )}

        {/* Price + CTA row */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {/* Price */}
          <div>
            <p className="text-lg font-black text-slate-900 leading-none">
              {formatCurrency(product.price)}
            </p>
            {product.mrp > product.price && (
              <p className="mt-0.5 text-xs font-medium text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </p>
            )}
          </div>

          {/* Add to cart OR quantity stepper */}
          <AnimatePresence mode="wait">
            {qty > 0 ? (
              <motion.div
                key="stepper"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="qty-stepper"
              >
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => updateQty(product._id, qty - 1)}
                  aria-label="Decrease quantity"
                >
                  <MinusIcon />
                </button>
                <span className="qty-num">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={(e) => {
                    updateQty(product._id, qty + 1);
                    animateToCart(imageSrc, e);
                  }}
                  aria-label="Increase quantity"
                >
                  <PlusIcon />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.93 }}
                type="button"
                disabled={outOfStock}
                onClick={handleAdd}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <PlusIcon />
                Add
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
