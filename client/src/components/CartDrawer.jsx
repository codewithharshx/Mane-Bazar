import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatters";

const CartDrawer = () => {
  const { cartItems, isDrawerOpen, setDrawerOpen, subtotal, updateQty, removeFromCart } =
    useCart();

  return (
    <AnimatePresence>
      {isDrawerOpen ? (
        <motion.div
          className="fixed inset-0 z-50 bg-slate-950/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDrawerOpen(false)}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your cart</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div key={item._id} className="flex gap-3 rounded-3xl bg-slate-50 p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.brand}</p>
                      <p className="mt-1 font-semibold text-green-700">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item._id, item.qty - 1)}
                            className="rounded-full bg-white px-2.5 py-1"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item._id, item.qty + 1)}
                            className="rounded-full bg-white px-2.5 py-1"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item._id)}
                          className="text-sm font-semibold text-rose-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                  <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add grocery essentials to start checkout.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Subtotal</span>
                <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className="mt-4 block rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 text-center font-semibold text-white"
              >
                View cart
              </Link>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default CartDrawer;
