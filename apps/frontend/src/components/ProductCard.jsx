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
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)",
  });
  document.body.appendChild(flyer);

  flyer.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(0.25)`,
        opacity: 0,
      },
    ],
    { duration: 450, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
  ).onfinish = () => flyer.remove();
};

/* ── Icons ───────────────────────────────────────────────────────── */
const HeartIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const MinusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ProductCard = ({ product, onQuickView, index = 0 }) => {
  const { addToCart, cartItems, updateQty } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const productId = String(product.id || product._id || "");
  const wishlisted = isWishlisted(productId);
  const inCart = cartItems.find((i) => String(i.id || i._id) === productId);
  const qty = inCart?.qty || 0;
  const outOfStock = product.stock < 1;
  const discount = product.discount || 0;
  const imageSrc = getProductImage(product);

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    animateToCart(imageSrc, e);
  };

  return (
    <motion.div
      data-product-card
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-3 hover:border-emerald-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group relative text-left"
    >
      {/* ── Image Area ────────────────────────────────────────── */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-50/80 overflow-hidden mb-2.5 p-2.5 border border-slate-100">
        
        {/* Clean Discount Badge (Top Left) */}
        {discount > 0 && !outOfStock && (
          <span
            style={{ position: "absolute", top: "8px", left: "8px", right: "auto", zIndex: 10 }}
            className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs leading-none"
          >
            {discount}% OFF
          </span>
        )}

        {/* Wishlist Button (Top Right) */}
        <button
          type="button"
          style={{ position: "absolute", top: "8px", right: "8px", left: "auto", zIndex: 10 }}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`p-1.5 rounded-full shadow-xs transition-all ${
            wishlisted
              ? "bg-rose-500 text-white"
              : "bg-white/95 text-slate-400 hover:text-rose-500 hover:bg-white"
          }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon filled={wishlisted} />
        </button>

        {/* Out of Stock Overlay */}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs rounded-xl">
            <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-black text-slate-800">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Product Image */}
        <Link to={`/products/${product.slug}`} className="flex items-center justify-center w-full h-full">
          <ProductImage
            product={product}
            alt={product.name}
            containerClassName="w-full h-full flex items-center justify-center bg-transparent"
            imageClassName="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      {/* ── Product Info ──────────────────────────────────────── */}
      <div className="flex flex-col flex-1">
        {/* Delivery Time & Brand Pill */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
            ⚡ 15 MINS
          </span>
          {product.brand && (
            <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[100px]">
              {product.brand}
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link to={`/products/${product.slug}`} className="block flex-1 mb-1">
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Pack Unit / Weight */}
        <p className="text-[11px] text-slate-500 font-medium mb-3">
          {product.unit || "1 unit"}
        </p>

        {/* ── Price & Quick-Add CTA Row ────────────────────────── */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div>
            <span className="text-sm sm:text-base font-black text-slate-900">
              {formatCurrency(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="ml-1 text-[11px] font-medium text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>

          {/* Quick-Commerce Stepper or Add Button */}
          <AnimatePresence mode="wait">
            {qty > 0 ? (
              <motion.div
                key="stepper"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="flex items-center rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => updateQty(productId, qty - 1)}
                  className="px-2.5 py-1.5 hover:bg-emerald-700 rounded-l-xl transition-colors"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon />
                </button>
                <span className="px-1 text-xs select-none">{qty}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    updateQty(productId, qty + 1);
                    animateToCart(imageSrc, e);
                  }}
                  className="px-2.5 py-1.5 hover:bg-emerald-700 rounded-r-xl transition-colors"
                  aria-label="Increase quantity"
                >
                  <PlusIcon />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                type="button"
                disabled={outOfStock}
                onClick={handleAdd}
                className="border border-emerald-600 bg-emerald-50/60 hover:bg-emerald-600 text-emerald-700 hover:text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl uppercase transition-all duration-150 shadow-2xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                + ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
