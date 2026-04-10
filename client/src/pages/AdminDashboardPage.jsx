import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import toast from "react-hot-toast";
import api from "../utils/api";
import AdminShell from "../components/AdminShell";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency } from "../utils/formatters";

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#10b981", "#f43f5e"];

const MetricCard = ({ label, value, sub, accent }) => (
  <div className="card-surface p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <h3
      className="mt-3 text-3xl font-extrabold"
      style={{ color: accent || "#0f172a" }}
    >
      {value}
    </h3>
    {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
  </div>
);

const CHART_TABS = ["7 Days", "Monthly"];

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [chartTab, setChartTab] = useState("7 Days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: response } = await api.get("/admin/dashboard");
        setData(response);
      } catch {
        toast.error("Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="Loading analytics…">
        <div className="flex items-center justify-center py-32">
          <span className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
      </AdminShell>
    );
  }

  if (!data) return null;

  const revenueData = chartTab === "7 Days" ? data.charts.dailyRevenue : data.charts.monthlyRevenue;
  const revenueKey = chartTab === "7 Days" ? "date" : "month";

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Today's orders, revenue movement, low-stock risks, and recent activity in one place."
    >
      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Orders today"
          value={data.stats.ordersToday}
          sub={`${data.stats.ordersThisMonth} this month`}
        />
        <MetricCard
          label="Total revenue"
          value={formatCurrency(data.stats.totalRevenue)}
          accent="#16a34a"
        />
        <MetricCard
          label="Total users"
          value={data.stats.totalUsers}
          sub={`+${data.stats.newUsersThisMonth} this month`}
          accent="#0ea5e9"
        />
        <MetricCard
          label="Low stock items"
          value={data.stats.lowStockCount}
          accent={data.stats.lowStockCount > 0 ? "#f43f5e" : "#16a34a"}
        />
      </div>

      {/* Revenue & Orders charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Revenue</h2>
            <div className="flex gap-2">
              {CHART_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setChartTab(tab)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    chartTab === tab
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey={revenueKey} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-slate-900">Order status mix</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.statusBreakdown.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={88}
                >
                  {data.charts.statusBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User growth + Top products */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-slate-900">User growth (12 months)</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-slate-900">Top products by sales</h2>
          <div className="mt-5 space-y-3">
            {(data.charts.topProducts || []).map((product, index) => (
              <div key={product._id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-extrabold text-green-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{product._id}</p>
                  <p className="text-xs text-slate-400">
                    {product.totalSold} units · {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
            {(!data.charts.topProducts || data.charts.topProducts.length === 0) && (
              <p className="text-sm text-slate-400">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low stock + Recent orders */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-slate-900">Low stock products</h2>
          <div className="mt-5 space-y-3">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-400">All products are well-stocked. 🎉</p>
            ) : (
              data.lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.category?.name}</p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-600">
                    {product.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-xl font-bold text-slate-900">Recent orders</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-semibold text-slate-900">{order.orderId}</td>
                    <td className="text-slate-600">{order.user?.name}</td>
                    <td>{formatCurrency(order.pricing.total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboardPage;
