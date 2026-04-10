export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatOrderStatus = (status = "") =>
  status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const getDiscountPercent = (mrp, price) => {
  if (!mrp || !price || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};
