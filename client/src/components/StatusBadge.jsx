import { formatOrderStatus } from "../utils/formatters";

const statusClasses = {
  placed: "bg-blue-100 text-blue-700",
  confirmed: "bg-sky-100 text-sky-700",
  packed: "bg-amber-100 text-amber-700",
  out_for_delivery: "bg-violet-100 text-violet-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-rose-100 text-rose-700"
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status] || "bg-slate-100 text-slate-700"}`}
  >
    {formatOrderStatus(status)}
  </span>
);

export default StatusBadge;
