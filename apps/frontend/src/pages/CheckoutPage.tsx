import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/api";
import toast from "react-hot-toast";
import { MapPin, Clock, CreditCard } from "lucide-react";

const DELIVERY_SLOTS = [
  { time: "7:00 AM - 10:00 AM", label: "Morning" },
  { time: "10:00 AM - 1:00 PM", label: "Midday" },
  { time: "5:00 PM - 8:00 PM", label: "Evening" },
];

const CheckoutPage = () => {
  const { cartItems, subtotal, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [slot, setSlot] = useState(DELIVERY_SLOTS[0]);
  const [form, setForm] = useState({
    street: user?.addresses?.[0]?.street || "",
    city: user?.addresses?.[0]?.city || "",
    pincode: user?.addresses?.[0]?.pincode || "",
    phone: user?.addresses?.[0]?.phone || "",
    label: "Home",
  });

  const discount = coupon
    ? coupon.discountType === "PERCENT"
      ? Math.round(subtotal * (coupon.discountValue / 100))
      : coupon.discountValue
    : 0;
  const deliveryCharge = subtotal - discount >= 499 ? 0 : 40;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + deliveryCharge + tax;

  const handleCOD = async () => {
    if (!form.street || !form.city || !form.pincode || !form.phone) {
      toast.error("Please fill in all delivery details");
      return;
    }
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        items: cartItems.map((i) => ({ productId: i._id, qty: i.qty })),
        deliveryAddress: form,
        deliverySlotDate: today,
        deliverySlotTime: slot.time,
        couponCode: coupon?.code,
      };
      const { data } = await orderApi.createCod(payload);
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/orders/${data.order?.orderId || data.orderId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-green-600" /> Delivery Address</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: "street", label: "Street Address", full: true },
                { key: "city", label: "City" },
                { key: "pincode", label: "Pincode" },
                { key: "phone", label: "Phone Number" },
              ].map(({ key, label, full }) => (
                <div key={key} className={full ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
            </div>
          </div>
          {/* Delivery Slot */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock size={16} className="text-green-600" /> Delivery Slot</h3>
            <div className="grid grid-cols-3 gap-3">
              {DELIVERY_SLOTS.map((s) => (
                <button key={s.time} onClick={() => setSlot(s)}
                  className={`p-3 rounded-xl border text-sm transition-all ${slot.time === s.time ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-slate-200 text-slate-600 hover:border-green-300"}`}>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs opacity-70">{s.time}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Payment */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={16} className="text-green-600" /> Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["COD", "RAZORPAY"] as const).map((method) => (
                <button key={method} onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all ${paymentMethod === method ? "border-green-500 bg-green-50 text-green-700" : "border-slate-200 text-slate-600 hover:border-green-300"}`}>
                  {method === "COD" ? "💵 Cash on Delivery" : "💳 Razorpay"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 h-fit sticky top-4">
          <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm text-slate-600 mb-4">
            <div className="flex justify-between"><span>Subtotal ({cartItems.length} items)</span><span>₹{subtotal}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount}</span></div>}
            <div className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? <span className="text-green-600">Free</span> : `₹${deliveryCharge}`}</span></div>
            <div className="flex justify-between"><span>Tax (5%)</span><span>₹{tax}</span></div>
          </div>
          <div className="border-t border-slate-100 pt-3 mb-5">
            <div className="flex justify-between font-bold text-slate-800 text-base"><span>Total</span><span>₹{total}</span></div>
          </div>
          <button onClick={handleCOD} disabled={loading || cartItems.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-btn-green">
            {loading ? "Placing Order..." : `Place Order • ₹${total}`}
          </button>
          <p className="text-xs text-slate-400 text-center mt-3">Secure checkout. No hidden charges.</p>
        </div>
      </div>
    </div>
  );
};
export default CheckoutPage;
