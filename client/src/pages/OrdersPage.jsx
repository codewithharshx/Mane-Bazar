import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { orderApi } from "../services/orderApi";
import { useCart } from "../context/CartContext";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import StatusBadge from "../components/StatusBadge";
import PageTransition from "../components/PageTransition";
import SkeletonLoader from "../components/SkeletonLoader";

const PAGE_SIZE = 10;

const OrdersPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reordering, setReordering] = useState(null); // orderId currently being re-ordered

  const fetchOrders = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const { data } = await orderApi.listMine({ page: pageNum, limit: PAGE_SIZE });
      // Support both { orders, totalPages } and plain array responses
      if (Array.isArray(data)) {
        setOrders(data);
        setTotalPages(1);
      } else {
        setOrders(data.orders ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      toast.error("Unable to load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const handleReorder = async (order) => {
    setReordering(order._id);
    try {
      let added = 0;
      for (const item of order.items) {
        // item.product may be populated or just an ID after lean()
        const product = item.product && typeof item.product === "object"
          ? item.product
          : { _id: item.product, name: item.name, price: item.price, stock: 99 };
        addToCart({ ...product, images: product.images ?? [item.image] }, item.qty);
        added++;
      }
      if (added > 0) {
        toast.success(`${added} item${added > 1 ? "s" : ""} added to cart`);
        navigate("/cart");
      }
    } catch {
      toast.error("Could not add items to cart");
    } finally {
      setReordering(null);
    }
  };

  return (
    <PageTransition className="section-shell space-y-6 py-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
          My orders
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
          Track your grocery deliveries and invoices
        </h1>
      </div>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <SkeletonLoader key={index} className="h-28" />
            ))
          : orders.map((order) => (
              <div
                key={order._id}
                className="card-surface flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Order {order.orderId}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatCurrency(order.pricing.total)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} · Placed on {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Delivery: {order.deliverySlot.date} · {order.deliverySlot.timeSlot}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusBadge status={order.status} />

                  <div className="flex items-center gap-2">
                    {/* Re-order button — only for completed or cancelled orders */}
                    {["delivered", "cancelled"].includes(order.status) && (
                      <button
                        type="button"
                        disabled={reordering === order._id}
                        onClick={() => handleReorder(order)}
                        className="rounded-full border border-green-600 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        {reordering === order._id ? "Adding…" : "Re-order"}
                      </button>
                    )}
                    <Link
                      to={`/orders/${order.orderId}`}
                      className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="card-surface p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">No orders yet</h2>
          <p className="mt-2 text-slate-500">
            Your grocery purchases will appear here after checkout.
          </p>
          <Link to="/products" className="gradient-button mt-6 inline-flex">
            Start shopping
          </Link>
        </div>
      )}
    </PageTransition>
  );
};

export default OrdersPage;
