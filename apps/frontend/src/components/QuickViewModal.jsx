import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency } from "../utils/formatters";
import { useCart } from "../context/CartContext";
import ProductImage from "./ProductImage";

const QuickViewModal = ({ product, onClose }) => {
  const { addToCart } = useCart();

  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
            className="glass-panel max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[32px] p-5"
          >
            <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
              <ProductImage
                product={product}
                alt={product.name}
                containerClassName="h-80 rounded-[28px]"
                className="h-full w-full rounded-[28px] object-cover"
              />
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
                  {product.brand}
                </p>
                <h3 className="text-3xl font-bold text-slate-900">{product.name}</h3>
                <p className="text-slate-600">{product.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-lg text-slate-400 line-through">
                    {formatCurrency(product.mrp)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="gradient-button"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default QuickViewModal;
