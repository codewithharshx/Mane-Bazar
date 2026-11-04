import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderApi, paymentApi } from "../services/api";
import toast from "react-hot-toast";
import { MapPin, Clock, CreditCard, CheckCircle2, Plus, ArrowLeft } from "lucide-react";

const DELIVERY_SLOTS = [
  { time: "7:00 AM - 10:00 AM", label: "Morning Slot" },
  { time: "10:00 AM - 1:00 PM", label: "Midday Slot" },
  { time: "5:00 PM - 8:00 PM", label: "Evening Slot" },
];

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { cartItems, subtotal, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [slot, setSlot] = useState(DELIVERY_SLOTS[0]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isCustomAddress, setIsCustomAddress] = useState<boolean>(
    !user?.addresses || user.addresses.length === 0
  );

  const [form, setForm] = useState({
    street: user?.addresses?.[0]?.street || "",
    city: user?.addresses?.[0]?.city || "",
    pincode: user?.addresses?.[0]?.pincode || "",
    phone: user?.addresses?.[0]?.phone || "",
    label: user?.addresses?.[0]?.label || "Home",
  });

  const discount = coupon
    ? coupon.discountType === "PERCENT"
      ? Math.round(subtotal * (coupon.discountValue / 100))
      : coupon.discountValue
    : 0;
  const deliveryCharge = subtotal - discount >= 499 ? 0 : 40;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = Math.max(0, subtotal - discount + deliveryCharge + tax);

  const handleSelectSavedAddress = (index: number) => {
    setSelectedAddressIndex(index);
    setIsCustomAddress(false);
    const addr = user?.addresses?.[index];
    if (addr) {
      setForm({
        street: addr.street || "",
        city: addr.city || "",
        pincode: addr.pincode || "",
        phone: addr.phone || "",
        label: addr.label || "Home",
      });
    }
  };

  const handleChooseCustomAddress = () => {
    setIsCustomAddress(true);
    setSelectedAddressIndex(-1);
    setForm({
      street: "",
      city: "",
      pincode: "",
      phone: user?.addresses?.[0]?.phone || "",
      label: "New Address",
    });
  };

  const validateInputs = (): boolean => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Add products to proceed.");
      return false;
    }
    if (!form.street.trim() || form.street.trim().length < 3) {
      toast.error("Please enter a valid street address (min 3 characters).");
      return false;
    }
    if (!form.city.trim()) {
      toast.error("Please enter your delivery city.");
      return false;
    }
    if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
      toast.error("Please enter a valid 6-digit Indian PIN code (e.g. 415404).");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      toast.error("Please enter a valid 10-digit Indian mobile number (starting with 6-9).");
      return false;
    }
    if (!slot?.time) {
      toast.error("Please select a valid delivery slot.");
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const payload = {
      items: cartItems.map((item) => ({
        productId: String(item.id || item._id),
        qty: Number(item.qty),
      })),
      deliveryAddress: {
        label: form.label || "Home",
        street: form.street.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
      },
      deliverySlot: {
        date: today,
        timeSlot: slot.time,
      },
      couponCode: coupon?.code || undefined,
    };

    try {
      if (paymentMethod === "COD") {
        const { data } = await orderApi.createCod(payload);
        clearCart();
        toast.success("Order placed successfully with Cash on Delivery!");
        navigate(`/orders/${data.order?.orderId || data.orderId}`);
        return;
      }

      // Razorpay Payment Flow
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Unable to load Razorpay payment gateway. Please check your network connection.");
        setLoading(false);
        return;
      }

      const { data } = await paymentApi.createOrder(payload);

      const razorpayKey =
        (window as any).RAZORPAY_KEY ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_SdHlNCUCWpl89B";

      const options = {
        key: razorpayKey,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "Mane Bazar",
        description: `Order #${data.orderId}`,
        order_id: data.order.id,
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "",
          contact: form.phone.trim(),
        },
        theme: {
          color: "#16a34a",
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await paymentApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            toast.success("Payment verified! Order confirmed.");
            navigate(`/orders/${verifyRes.data.order?.orderId || data.orderId}`);
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast("Payment cancelled. You can complete the checkout anytime.", { icon: "ℹ️" });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        paymentApi
          .paymentFailed({
            razorpayOrderId: response.error?.metadata?.order_id || data.order.id,
            reason: response.error?.description || "Payment failed",
          })
          .catch(() => {});
        toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
      });

      rzp.open();
    } catch (err: any) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors
          .map((e: any) => `${e.field ? `${e.field}: ` : ""}${e.message}`)
          .join(", ");
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.message || "Failed to process order. Please check details.");
      }
    } finally {
      if (paymentMethod === "COD") {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            <span>Back to Shopping Cart</span>
          </Link>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-slate-900"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Checkout & Delivery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Safe, encrypted checkout with instant tax invoice and live slot tracking.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* ── 1. Delivery Address ─────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-lg text-slate-900 flex items-center gap-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <div className="p-2 rounded-xl bg-green-50 text-green-700">
                  <MapPin size={18} />
                </div>
                <span>1. Delivery Address</span>
              </h3>
            </div>

            {/* Saved Addresses List */}
            {user?.addresses && user.addresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Saved Delivery Addresses
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {user.addresses.map((addr: any, idx: number) => {
                    const isSelected = !isCustomAddress && selectedAddressIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSavedAddress(idx)}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-green-600 bg-green-50/50 ring-2 ring-green-600/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {addr.label || `Address ${idx + 1}`}
                          </span>
                          {isSelected && <CheckCircle2 size={16} className="text-green-600" />}
                        </div>
                        <p className="text-xs text-slate-600 font-medium line-clamp-2">
                          {addr.street}, {addr.city}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          PIN: {addr.pincode} • Phone: {addr.phone}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleChooseCustomAddress}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed transition-all ${
                      isCustomAddress
                        ? "border-green-600 bg-green-50/50 text-green-700 font-semibold"
                        : "border-slate-300 text-slate-600 hover:border-green-400"
                    }`}
                  >
                    <Plus size={16} />
                    <span className="text-xs font-semibold">Enter New Address</span>
                  </button>
                </div>
              </div>
            )}

            {/* Address Form Inputs */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {isCustomAddress ? "New Address Details" : "Selected Address Verification"}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address & House / Flat No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="e.g. Flat 301, Shree Ganesh Apartments, Main Bazaar Road"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Kasegaon / Sangli"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code (6 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. 415404"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Contact Phone (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. Delivery Slot ────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3
              className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <div className="p-2 rounded-xl bg-green-50 text-green-700">
                <Clock size={18} />
              </div>
              <span>2. Choose Delivery Slot</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DELIVERY_SLOTS.map((s) => {
                const isSelected = slot.time === s.time;
                return (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "border-green-600 bg-green-50/60 ring-2 ring-green-600/20"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{s.label}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-green-600" />}
                    </div>
                    <div className="text-xs font-medium text-slate-500">{s.time}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Orders placed today are batched and dispatched within your chosen window.
            </p>
          </div>

          {/* ── 3. Payment Method ───────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h3
              className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              <div className="p-2 rounded-xl bg-green-50 text-green-700">
                <CreditCard size={18} />
              </div>
              <span>3. Payment Method</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === "COD"
                    ? "border-green-600 bg-green-50/60 ring-2 ring-green-600/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">💵 Cash on Delivery (COD)</span>
                  {paymentMethod === "COD" && <CheckCircle2 size={16} className="text-green-600" />}
                </div>
                <p className="text-xs text-slate-500">Pay cash or UPI directly to delivery agent.</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("RAZORPAY")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === "RAZORPAY"
                    ? "border-green-600 bg-green-50/60 ring-2 ring-green-600/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">💳 Online Payment (Razorpay)</span>
                  {paymentMethod === "RAZORPAY" && <CheckCircle2 size={16} className="text-green-600" />}
                </div>
                <p className="text-xs text-slate-500">UPI (GPay, PhonePe, Paytm), Cards, Netbanking.</p>
              </button>
            </div>
          </div>
        </div>

        {/* ── Order Summary Sidebar ─────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-6">
            <h3
              className="text-lg font-bold text-slate-900 mb-4"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Order Summary
            </h3>

            {/* Cart Items list preview */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1 mb-4 text-xs">
              {cartItems.map((item) => (
                <div key={item.id || item._id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    <span className="text-slate-400">×{item.qty}</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    ₹{Number(item.price) * Number(item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
                <span className="font-semibold text-slate-800">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className="font-bold text-green-700">FREE</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span
                  className="text-sm font-bold text-slate-800"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  Grand Total
                </span>
                <span
                  className="text-2xl font-black text-slate-900"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  ₹{total}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Includes all taxes and packaging.</p>
            </div>

            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={loading || cartItems.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processing Order...</span>
              ) : (
                <span>
                  Confirm & Place Order • ₹{total}
                </span>
              )}
            </button>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-400 text-center">
              <p>🔒 256-bit SSL encrypted checkout</p>
              <p>📄 Automatic PDF invoice generated upon order confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
