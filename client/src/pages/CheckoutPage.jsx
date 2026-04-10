import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { DELIVERY_SLOTS } from "../utils/constants";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import PageTransition from "../components/PageTransition";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, subtotal, coupon, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.[0]?._id || "");
  const [manualAddress, setManualAddress] = useState({
    label: "Home",
    street: "",
    city: "",
    pincode: "",
    phone: ""
  });
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const pricing = useMemo(() => {
    const discount = coupon?.discount || 0;
    const deliveryCharge = subtotal >= 499 ? 0 : 40;
    const tax = (subtotal - discount) * 0.05;
    return {
      subtotal,
      discount,
      deliveryCharge,
      tax,
      total: subtotal - discount + deliveryCharge + tax
    };
  }, [subtotal, coupon]);

  const selectedAddress = user?.addresses?.find((item) => item._id === selectedAddressId);

  const getDeliveryAddress = () => selectedAddress || manualAddress;

  const buildPayload = () => ({
    items: cartItems.map((item) => ({ productId: item._id, qty: item.qty })),
    deliveryAddress: getDeliveryAddress(),
    deliverySlot: {
      date: deliveryDate,
      timeSlot: deliverySlot
    },
    couponCode: coupon?.code || ""
  });

  const handleSuccess = (orderId) => {
    clearCart();
    toast.success("Order placed successfully");
    navigate(`/orders/${orderId}`);
  };

  const handleCOD = async () => {
    const { data } = await api.post("/orders/cod", buildPayload());
    handleSuccess(data.order.orderId);
  };

  const handleRazorpay = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error("Unable to load Razorpay checkout");
    }

    const { data } = await api.post("/payment/create-order", buildPayload());

    await new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Mane Bazar",
        description: "Grocery order payment",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyPayload = {
              ...buildPayload(),
              orderReceipt: data.order.receipt,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            };
            const verifyResponse = await api.post("/payment/verify", verifyPayload);
            handleSuccess(verifyResponse.data.order.orderId);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: getDeliveryAddress().phone
        },
        theme: {
          color: "#16a34a"
        },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled"))
        }
      });

      razorpay.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    const address = getDeliveryAddress();
    if (!address.street || !address.city || !address.pincode) {
      toast.error("Please provide a delivery address");
      return;
    }

    setPlacingOrder(true);
    try {
      if (paymentMethod === "cod") {
        await handleCOD();
      } else {
        await handleRazorpay();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Checkout failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <PageTransition className="section-shell grid gap-8 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Confirm address, delivery slot, and payment method
          </h1>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-xl font-bold text-slate-900">Delivery address</h2>
          {user?.addresses?.length ? (
            <div className="mt-4 space-y-3">
              {user.addresses.map((address) => (
                <label
                  key={address._id}
                  className={`block rounded-3xl border p-4 ${selectedAddressId === address._id ? "border-green-500 bg-green-50" : "border-slate-200"}`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mr-3"
                    checked={selectedAddressId === address._id}
                    onChange={() => setSelectedAddressId(address._id)}
                  />
                  <span className="font-semibold text-slate-900">{address.label}</span>
                  <p className="mt-1 text-sm text-slate-600">
                    {address.street}, {address.city} - {address.pincode}
                  </p>
                </label>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              value={manualAddress.label}
              onChange={(event) => setManualAddress((current) => ({ ...current, label: event.target.value }))}
              className="input-field"
              placeholder="Address label"
            />
            <input
              value={manualAddress.phone}
              onChange={(event) => setManualAddress((current) => ({ ...current, phone: event.target.value }))}
              className="input-field"
              placeholder="Phone number"
            />
            <input
              value={manualAddress.street}
              onChange={(event) => setManualAddress((current) => ({ ...current, street: event.target.value }))}
              className="input-field sm:col-span-2"
              placeholder="Street address"
            />
            <input
              value={manualAddress.city}
              onChange={(event) => setManualAddress((current) => ({ ...current, city: event.target.value }))}
              className="input-field"
              placeholder="City"
            />
            <input
              value={manualAddress.pincode}
              onChange={(event) => setManualAddress((current) => ({ ...current, pincode: event.target.value }))}
              className="input-field"
              placeholder="Pincode"
            />
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-xl font-bold text-slate-900">Delivery slot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} className="input-field">
              <option value={new Date().toISOString().slice(0, 10)}>Today</option>
              <option value={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}>Tomorrow</option>
            </select>
            <select value={deliverySlot} onChange={(event) => setDeliverySlot(event.target.value)} className="input-field">
              {DELIVERY_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-xl font-bold text-slate-900">Payment method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["razorpay", "cod"].map((method) => (
              <label
                key={method}
                className={`rounded-3xl border p-4 ${paymentMethod === method ? "border-green-500 bg-green-50" : "border-slate-200"}`}
              >
                <input
                  type="radio"
                  className="mr-3"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="font-semibold text-slate-900">
                  {method === "razorpay" ? "Razorpay Online Payment" : "Cash on Delivery"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <aside className="card-surface h-fit p-6">
        <h2 className="text-2xl font-bold text-slate-900">Order summary</h2>
        <div className="mt-5 space-y-3">
          {cartItems.map((item) => (
            <div key={item._id} className="flex items-center justify-between text-sm text-slate-600">
              <span>
                {item.name} x {item.qty}
              </span>
              <span>{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(pricing.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Coupon</span>
            <span>- {formatCurrency(pricing.discount)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>GST</span>
            <span>{formatCurrency(pricing.tax)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Delivery</span>
            <span>{pricing.deliveryCharge ? formatCurrency(pricing.deliveryCharge) : "Free"}</span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-700">Total payable</span>
          <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(pricing.total)}</span>
        </div>
        <button
          type="button"
          disabled={placingOrder}
          onClick={handlePlaceOrder}
          className="gradient-button mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {placingOrder ? "Processing..." : paymentMethod === "cod" ? "Place COD order" : "Pay with Razorpay"}
        </button>
      </aside>
    </PageTransition>
  );
};

export default CheckoutPage;
