import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import ProductImage from "../components/ProductImage";

const CartPage = () => {
  const { cartItems, updateQty, removeFromCart, subtotal, coupon } = useCart();

  const discount = coupon
    ? coupon.discountType === "PERCENT"
      ? Math.round(subtotal * (coupon.discountValue / 100))
      : coupon.discountValue
    : 0;
  const deliveryCharge = subtotal - discount >= 499 ? 0 : 40;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = Math.max(0, subtotal - discount + deliveryCharge + tax);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4 select-none">🛒</div>
        <h2
          className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-6 max-w-sm">
          Looks like you haven't added any groceries to your basket yet.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
        >
          <ShoppingBag size={18} />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1
          className="text-3xl font-extrabold text-slate-900"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Your Shopping Cart
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your items before proceeding to instant delivery checkout.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => {
            const itemId = String(item.id || item._id);
            return (
              <div
                key={itemId}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 flex gap-4 items-center shadow-sm"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <ProductImage
                    product={item}
                    alt={item.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-400">{item.brand}</p>
                  <p className="font-bold text-green-700 mt-1">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => updateQty(itemId, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm text-slate-600"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(itemId, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm text-slate-600"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(itemId)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors ml-2"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 h-fit sticky top-6 shadow-sm">
          <h3
            className="font-bold text-lg text-slate-800 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Order Summary
          </h3>
          <div className="space-y-2.5 text-sm mb-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
              <span className="font-semibold text-slate-900">₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Discount ({coupon?.code})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>
                {deliveryCharge === 0 ? (
                  <span className="font-bold text-green-700">FREE</span>
                ) : (
                  `₹${deliveryCharge}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (5%)</span>
              <span>₹{tax}</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 mb-5">
            <div className="flex justify-between font-bold text-slate-900 text-lg">
              <span>Total Amount</span>
              <span>₹{total}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Free delivery applied on orders over ₹499.</p>
          </div>
          <Link
            to="/checkout"
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
