import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import { orderApi } from "../services/orderApi";
import AdminShell from "../components/AdminShell";
import StatusBadge from "../components/StatusBadge";
import { ORDER_STATUSES } from "../utils/constants";
import { formatCurrency, formatDateTime } from "../utils/formatters";

const PAGE_SIZE = 15;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;

      const { data } = await adminApi.orders(params);
      setOrders(data.orders);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); fetchOrders(); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const updateStatus = async (orderId, status) => {
    try {
      await orderApi.updateStatus(orderId, { status });
      toast.success("Status updated");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update status");
    }
  };

  const ALL_STATUSES = ["all", ...ORDER_STATUSES];

  return (
    <AdminShell
      title="Orders"
      subtitle={`${total} total orders — track and update delivery stages.`}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs py-2.5 text-sm"
          placeholder="Search by order ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field max-w-[200px] py-2.5 text-sm"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="card-surface overflow-x-auto p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="spinner" />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Placed</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-semibold text-slate-900">{order.orderId}</td>
                    <td>
                      <div className="font-medium text-slate-900">{order.user?.name}</div>
                      <div className="text-xs text-slate-400">{order.user?.email}</div>
                    </td>
                    <td className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</td>
                    <td className="font-semibold">{formatCurrency(order.pricing.total)}</td>
                    <td>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.orderId, e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="secondary-button py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button
            type="button"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
            className="secondary-button py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </AdminShell>
  );
};

export default AdminOrdersPage;
