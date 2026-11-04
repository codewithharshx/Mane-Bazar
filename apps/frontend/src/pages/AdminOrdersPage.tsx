import { useEffect, useState } from "react";
import { adminApi } from "../services/api";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.orders()
      .then((res) => setOrders(res.data?.orders || res.data?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Orders Management</h1>
      {loading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div> : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Order ID", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order: any) => (
                <tr key={order.id || order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">#{order.orderId}</td>
                  <td className="px-4 py-3 text-slate-600">{order.user?.name || order.userId}</td>
                  <td className="px-4 py-3 text-slate-500">{order.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">₹{order.total}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{order.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="text-center py-12 text-slate-400">No orders yet</p>}
        </div>
      )}
    </div>
  );
};
export default AdminOrdersPage;
