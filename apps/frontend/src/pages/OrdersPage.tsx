import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../services/api";
import { Package, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PACKED: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING_PAYMENT: "bg-slate-100 text-slate-600",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.listMine()
      .then((res) => setOrders(res.data?.orders || res.data?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">My Orders</h1>
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">No orders yet</p>
          <Link to="/products" className="mt-4 inline-block text-green-600 font-medium hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link key={order.id || order._id} to={`/orders/${order.orderId || order.id || order._id}`}
              className="block bg-white rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-card transition-all p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">#{order.orderId}</p>
                  <p className="text-sm text-slate-500">{order.items?.length || 0} item(s) • ₹{order.total}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>{order.status}</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
