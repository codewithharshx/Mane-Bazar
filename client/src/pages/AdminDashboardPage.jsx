import { lazy, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import AdminShell from "../components/AdminShell";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency } from "../utils/formatters";

const AdminDashboardCharts = lazy(() => import("../components/AdminDashboardCharts"));

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
        const { data: response } = await adminApi.dashboard();
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

  if (!data) {
    return (
      <AdminShell title="Dashboard" subtitle="Analytics unavailable right now">
        <div className="card-surface p-8 text-center">
          <p className="font-semibold text-slate-700">Unable to load dashboard data.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </AdminShell>
    );
  }

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

      <Suspense
        fallback={
          <div className="card-surface p-8 text-center text-slate-500">
            Loading dashboard charts...
          </div>
        }
      >
        <AdminDashboardCharts
          data={data}
          chartTab={chartTab}
          setChartTab={setChartTab}
          chartTabs={CHART_TABS}
        />
      </Suspense>

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
