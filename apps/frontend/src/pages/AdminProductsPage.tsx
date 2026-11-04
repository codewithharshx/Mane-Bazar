import { useEffect, useState } from "react";
import { productApi } from "../services/api";

const AdminProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.list({ limit: 50 })
      .then((res) => setProducts(res.data?.products || res.data?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Products Management</h1>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Product", "Brand", "Price", "Stock", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p: any) => (
                <tr key={p.id || p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || p.image || ""} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                      <span className="font-medium text-slate-800 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.brand}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">₹{p.price}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.stock < 10 ? "text-red-600" : "text-slate-700"}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-center py-12 text-slate-400">No products found. Run: <code>npm run db:seed</code></p>}
        </div>
      )}
    </div>
  );
};
export default AdminProductsPage;
