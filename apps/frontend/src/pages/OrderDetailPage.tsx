import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderApi } from "../services/api";
import { ArrowLeft, Download } from "lucide-react";

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    orderApi.getByOrderId(orderId)
      .then((res) => setOrder(res.data?.order || res.data))
      .catch(() => navigate("/orders"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const downloadInvoice = async () => {
    if (!order) return;
    try {
      const res = await orderApi.invoice(order.orderId || orderId!);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderId}.pdf`;
      a.click();
    } catch { }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse"><div className="h-48 bg-slate-100 rounded-2xl" /></div>;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-green-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Orders
      </button>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Order ID</p>
              <h1 className="font-display text-xl font-bold">#{order.orderId}</h1>
            </div>
            <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">{order.status}</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Items */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Items Ordered</h3>
            <div className="space-y-2">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{item.name} × {item.qty}</span>
                  <span className="font-medium">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Pricing */}
          <div className="border-t border-slate-100 pt-4">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
              <div className="flex justify-between"><span>Delivery</span><span>₹{order.deliveryCharge}</span></div>
              <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2 mt-2"><span>Total</span><span>₹{order.total}</span></div>
            </div>
          </div>
          {/* Delivery */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-800 mb-2">Delivery Address</h3>
            <p className="text-sm text-slate-600">{order.deliveryStreet}, {order.deliveryCity} - {order.deliveryPincode}</p>
            <p className="text-sm text-slate-500 mt-1">Slot: {order.deliverySlotDate} | {order.deliverySlotTime}</p>
          </div>
          <button onClick={downloadInvoice}
            className="w-full flex items-center justify-center gap-2 border border-green-600 text-green-600 font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors">
            <Download size={16} /> Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
export default OrderDetailPage;
