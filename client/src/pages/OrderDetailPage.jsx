import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { orderApi } from "../services/orderApi";
import { formatCurrency, formatDateTime, formatOrderStatus } from "../utils/formatters";
import StatusBadge from "../components/StatusBadge";
import PageTransition from "../components/PageTransition";
import SkeletonLoader from "../components/SkeletonLoader";

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await orderApi.getByOrderId(orderId);
        setOrder(data);
      } catch (error) {
        toast.error("Unable to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const downloadInvoice = async () => {
    try {
      const response = await orderApi.invoice(order.orderId);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `${order.orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("Unable to download invoice");
    }
  };

  const cancelOrder = async () => {
    try {
      await orderApi.cancel(order.orderId);
      toast.success("Order cancelled");
      navigate("/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel order");
    }
  };

  if (loading) {
    return (
      <div className="section-shell space-y-5 py-6">
        <SkeletonLoader className="h-20" />
        <SkeletonLoader className="h-[380px]" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <PageTransition className="section-shell space-y-6 py-6">
      <div className="card-surface flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            Order {order.orderId}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatCurrency(order.pricing.total)}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status={order.status} />
          <button type="button" onClick={downloadInvoice} className="accent-button">
            Download invoice
          </button>
          {["placed", "confirmed"].includes(order.status) ? (
            <button
              type="button"
              onClick={cancelOrder}
              className="rounded-full border border-rose-200 px-5 py-3 font-semibold text-rose-500"
            >
              Cancel order
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-6">
          <h2 className="text-xl font-bold text-slate-900">Status timeline</h2>
          <div className="mt-6 space-y-5">
            {order.statusHistory.map((history, index) => (
              <div key={`${history.status}-${index}`} className="flex gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {formatOrderStatus(history.status)}
                  </p>
                  <p className="text-sm text-slate-500">{history.note}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(history.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-slate-900">Delivery details</h2>
            <p className="mt-4 text-sm text-slate-600">
              {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Slot: {order.deliverySlot.date} | {order.deliverySlot.timeSlot}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Payment: {order.paymentMethod.toUpperCase()} | {formatOrderStatus(order.paymentStatus)}
            </p>
          </div>

          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-slate-900">Items</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item, index) => (
                <div key={`${item.product}-${index}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Qty {item.qty}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default OrderDetailPage;
