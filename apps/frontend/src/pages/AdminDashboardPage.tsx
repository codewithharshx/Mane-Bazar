import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import { Users, ShoppingBag, TrendingUp, Package } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="font-display text-2xl font-bold text-slate-800">{value ?? "—"}</p>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={ShoppingBag} label="Total Orders" value={data?.totalOrders} color="bg-blue-500" />
            <StatCard icon={TrendingUp} label="Revenue" value={data?.totalRevenue ? `₹${data.totalRevenue.toLocaleString()}` : "₹0"} color="bg-green-500" />
            <StatCard icon={Users} label="Total Users" value={data?.totalUsers} color="bg-purple-500" />
            <StatCard icon={Package} label="Products" value={data?.totalProducts} color="bg-orange-500" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Recent Orders</h3>
            {(data?.recentOrders || []).length === 0
              ? <p className="text-slate-400 text-sm">No orders yet</p>
              : <div className="space-y-2">
                  {data.recentOrders.map((order: any) => (
                    <div key={order.id || order._id} className="flex justify-between text-sm py-2 border-b border-slate-50">
                      <span className="font-medium text-slate-700">#{order.orderId}</span>
                      <span className="text-slate-500">₹{order.total}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{order.status}</span>
                    </div>
                  ))}
                </div>}
          </div>
        </>
      )}
    </div>
  );
};
export default AdminDashboardPage;
