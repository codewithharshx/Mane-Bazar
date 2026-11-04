import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatters";

/* ── Icons ───────────────────────────────────────────────────────── */
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);
const ShoppingBagIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const FREE_DELIVERY_THRESHOLD = 499;

const CartDrawer = () => {
  const { cartItems, isDrawerOpen, setDrawerOpen, subtotal, updateQty, removeFromCart } = useCart();

  const amountLeft = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 flex w-full max-w-sm flex-col bg-white shadow-drawer"
          >
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Your Cart
                  </h2>
                  <p className="text-xs text-slate-500">
                    {cartItems.length === 0
                      ? "Empty"
                      : `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Close cart"
              >
                <XIcon />
              </button>
            </div>

            {/* ── Delivery progress ──────────────────────────────── */}
            {cartItems.length > 0 && (
              <div className={`px-5 py-3 text-xs font-semibold ${freeDelivery ? "bg-green-50" : "bg-amber-50"}`}>
                {freeDelivery ? (
                  <span className="text-green-700">🎉 You've unlocked free delivery!</span>
                ) : (
                  <span className="text-amber-700">
                    Add {formatCurrency(amountLeft)} more for <strong>free delivery</strong>
                  </span>
                )}
                <div className="delivery-progress mt-2" style={{ background: freeDelivery ? "#bbf7d0" : "#fde68a" }}>
                  <div className="delivery-progress-fill" style={{ width: `${progressPct}%`, background: freeDelivery ? "#16a34a" : "#f97316" }} />
                </div>
              </div>
            )}

            {/* ── Items list ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <AnimatePresence>
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-full min-h-64 flex-col items-center justify-center text-center py-12"
                  >
                    <div className="text-slate-300 mb-4">
                      <ShoppingBagIcon />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Your cart is empty
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500 max-w-[200px]">
                      Add your favourite grocery items to get started
                    </p>
                    <Link
                      to="/products"
                      onClick={() => setDrawerOpen(false)}
                      className="mt-5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                    >
                      Browse Products
                    </Link>
                  </motion.div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.22 }}
                      className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    >
                      {/* Image */}
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.brand}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm font-bold text-green-700">{formatCurrency(item.price * item.qty)}</p>
                          <div className="flex items-center gap-1">
                            {/* Qty stepper */}
                            <div className="qty-stepper" style={{ "--scale": "0.9" }}>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: "28px", height: "28px" }}
                                onClick={() => updateQty(item._id, item.qty - 1)}
                              >
                                {item.qty === 1 ? <TrashIcon /> : <MinusIcon />}
                              </button>
                              <span className="qty-num text-xs">{item.qty}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: "28px", height: "28px" }}
                                onClick={() => updateQty(item._id, item.qty + 1)}
                              >
                                <PlusIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ─────────────────────────────────────────── */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-4 space-y-3 bg-white">
                {/* Order summary */}
                <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Delivery</span>
                    <span className={`font-semibold ${freeDelivery ? "text-green-600" : "text-slate-800"}`}>
                      {freeDelivery ? "FREE 🎉" : formatCurrency(40)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-lg font-black text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {formatCurrency(subtotal + (freeDelivery ? 0 : 40))}
                    </span>
                  </div>
                </div>

                {/* CTA buttons */}
                <Link
                  to="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all"
                >
                  Proceed to Checkout
                  <ArrowRightIcon />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="block w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
