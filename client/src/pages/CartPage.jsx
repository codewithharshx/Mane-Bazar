import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { couponApi } from "../services/couponApi";
import { formatCurrency } from "../utils/formatters";
import PageTransition from "../components/PageTransition";

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    coupon,
    subtotal,
    updateQty,
    removeFromCart,
    applyCoupon,
    removeCoupon
  } = useCart();
  const [couponCode, setCouponCode] = useState(coupon?.code || "");

  const deliveryCharge = subtotal >= 499 ? 0 : 40;
  const tax = (subtotal - (coupon?.discount || 0)) * 0.05;
  const total = subtotal - (coupon?.discount || 0) + tax + deliveryCharge;

  const handleCouponApply = async () => {
    if (!isAuthenticated) {
      toast.error("Login to apply coupons");
      return;
    }

    try {
      const { data } = await couponApi.apply({
        code: couponCode,
        subtotal
      });
      applyCoupon(data);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid coupon");
    }
  };

  return (
    <PageTransition className="section-shell grid gap-8 py-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            Your basket
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Review items before checkout
          </h1>
        </div>
        {cartItems.length ? (
          cartItems.map((item) => (
            <div key={item._id} className="card-surface flex gap-4 p-4">
              <img src={item.image} alt={item.name} className="h-28 w-28 rounded-3xl object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.brand}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-base font-semibold text-green-700">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-1">
                    <button type="button" className="px-3 py-2" onClick={() => updateQty(item._id, item.qty - 1)}>
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{item.qty}</span>
                    <button type="button" className="px-3 py-2" onClick={() => updateQty(item._id, item.qty + 1)}>
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
          <div className="card-surface p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mt-2 text-slate-500">Browse products and add grocery staples to continue.</p>
            <Link to="/products" className="gradient-button mt-6 inline-flex">
              Browse products
            </Link>
          </div>
        )}
      </div>

      <aside className="card-surface h-fit p-6">
        <h2 className="text-2xl font-bold text-slate-900">Price summary</h2>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Coupon discount</span>
            <span>- {formatCurrency(coupon?.discount || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>GST (5%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Delivery</span>
            <span>{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-50 p-4">
          <label className="text-sm font-semibold text-slate-700">Coupon code</label>
          <div className="mt-3 flex gap-2">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="WELCOME50"
              className="input-field"
            />
            <button type="button" onClick={handleCouponApply} className="accent-button whitespace-nowrap">
              Apply
            </button>
          </div>
          {coupon ? (
            <button type="button" onClick={removeCoupon} className="mt-3 text-sm font-semibold text-rose-500">
              Remove coupon {coupon.code}
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
          <span className="text-lg font-semibold text-slate-700">Grand total</span>
          <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(total)}</span>
        </div>

        <button
          type="button"
          disabled={!cartItems.length}
          onClick={() => navigate(isAuthenticated ? "/checkout" : "/login")}
          className="gradient-button mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          Proceed to checkout
        </button>
      </aside>
    </PageTransition>
  );
};

export default CartPage;
