import { useEffect, useState } from "react";
import { adminApi } from "../services/api";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

const AdminInventoryPage = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});

  useEffect(() => {
    adminApi.inventory()
      .then((res) => setInventory(res.data?.inventory || res.data?.data || []))
      .catch(() => setInventory([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRestock = async (productId: string) => {
    const qty = parseInt(restockQty[productId] || "0");
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    try {
      await adminApi.restock(productId, qty);
      setInventory((prev) => prev.map((p) => p.id === productId || p._id === productId ? { ...p, stock: p.stock + qty } : p));
      setRestockQty((prev) => ({ ...prev, [productId]: "" }));
      toast.success("Stock updated!");
    } catch { toast.error("Failed to restock"); }
  };

  const lowStock = inventory.filter((p) => p.stock <= (p.lowStockThreshold || 10));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Inventory Management</h1>
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">{lowStock.length} product(s) have low stock</p>
            <p className="text-amber-600 text-sm">{lowStock.map((p: any) => p.name).join(", ")}</p>
          </div>
        </div>
      )}
      {loading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div> : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Product", "Current Stock", "Threshold", "Status", "Restock"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inventory.map((p: any) => {
                const id = p.id || p._id;
                const isLow = p.stock <= (p.lowStockThreshold || 10);
                return (
                  <tr key={id} className={`hover:bg-slate-50 transition-colors ${isLow ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${isLow ? "text-red-600" : "text-slate-700"}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{p.lowStockThreshold || 10}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" value={restockQty[id] || ""} placeholder="Qty"
                          onChange={(e) => setRestockQty((prev) => ({ ...prev, [id]: e.target.value }))}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                        <button onClick={() => handleRestock(id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors">
                          Add
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && <p className="text-center py-12 text-slate-400">No inventory data. Seed the database first.</p>}
        </div>
      )}
    </div>
  );
};
export default AdminInventoryPage;
