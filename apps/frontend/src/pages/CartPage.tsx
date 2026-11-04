import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

const CartPage = () => {
  const { cartItems, updateQty, removeFromCart, subtotal, coupon } = useCart();

  const discount = coupon
    ? coupon.discountType === "PERCENT"
      ? Math.round(subtotal * (coupon.discountValue / 100))
      : coupon.discountValue
    : 0;
  const deliveryCharge = subtotal >= 499 ? 0 : 40;
  const total = subtotal - discount + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Add some delicious groceries to get started!</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-green-700 transition-colors">
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 items-center">
              <img src={item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"} alt={item.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.brand}</p>
                <p className="font-bold text-green-700 mt-1">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <button onClick={() => removeFromCart(item._id)} className="text-slate-300 hover:text-red-400 transition-colors ml-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 h-fit sticky top-4">
          <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({coupon?.code})</span><span>-₹{discount}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{deliveryCharge === 0 ? <span className="text-green-600">Free</span> : `₹${deliveryCharge}`}</span></div>
          </div>
          <div className="border-t border-slate-100 pt-3 mb-4">
            <div className="flex justify-between font-bold text-slate-800"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          <Link to="/checkout"
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-btn-green">
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default CartPage;
