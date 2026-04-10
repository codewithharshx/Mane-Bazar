import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import StatusBadge from "../components/StatusBadge";
import PageTransition from "../components/PageTransition";
import SkeletonLoader from "../components/SkeletonLoader";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/my-orders");
        setOrders(data);
      } catch (error) {
        toast.error("Unable to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
                    Placed on {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Delivery slot: {order.deliverySlot.date} | {order.deliverySlot.timeSlot}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusBadge status={order.status} />
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
      </div>

      {!loading && orders.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">No orders yet</h2>
          <p className="mt-2 text-slate-500">Your grocery purchases will appear here after checkout.</p>
          <Link to="/products" className="gradient-button mt-6 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : null}
    </PageTransition>
  );
};

export default OrdersPage;
