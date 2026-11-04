import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import AdminShell from "../components/AdminShell";

const AdminInventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState({});
  const [quantities, setQuantities] = useState({});

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.inventory();
      setProducts(data);
      // Initialise quantity inputs to 10 each
      const initQtys = {};
      data.forEach((p) => { initQtys[p._id] = 10; });
      setQuantities(initQtys);
    } catch {
      toast.error("Unable to load inventory alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRestock = async (productId) => {
    const qty = Number(quantities[productId]);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    setRestocking((prev) => ({ ...prev, [productId]: true }));
    try {
      const { data } = await adminApi.restock(productId, qty);
      toast.success(data.message);
      // Update product inline or re-fetch
      setProducts((prev) =>
        prev
          .map((p) => (p._id === productId ? { ...p, stock: data.product.stock } : p))
          .filter((p) => p.stock < p.lowStockThreshold) // remove if no longer low
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to restock");
    } finally {
      setRestocking((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <AdminShell
      title="Inventory alerts"
      subtitle="Products running below their restock threshold — replenish stock before fulfilment is affected."
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl bg-green-50 p-10 text-center">
          <p className="text-2xl font-bold text-green-700">🎉 All clear!</p>
          <p className="mt-2 text-sm text-green-600">
            No products are currently below their low-stock threshold.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product._id} className="card-surface p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">{product.name}</h2>
                  <p className="text-xs text-slate-400">{product.category?.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
                  Low stock
                </span>
              </div>

              {/* Stock progress */}
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                  <span>Current: <b className="text-slate-700">{product.stock}</b></span>
                  <span>Threshold: <b className="text-slate-700">{product.lowStockThreshold}</b></span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (product.stock / product.lowStockThreshold) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Restock controls */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={quantities[product._id] ?? 10}
                  onChange={(e) =>
                    setQuantities((prev) => ({ ...prev, [product._id]: e.target.value }))
                  }
                  className="input-field w-24 py-2 text-sm text-center"
                />
                <button
                  type="button"
                  onClick={() => handleRestock(product._id)}
                  disabled={restocking[product._id]}
                  className="gradient-button flex-1 justify-center py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {restocking[product._id] ? (
                    <span className="flex items-center gap-2">
                      <span className="spinner" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} />
                      Restocking…
                    </span>
                  ) : (
                    "Restock"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
};

export default AdminInventoryPage;
