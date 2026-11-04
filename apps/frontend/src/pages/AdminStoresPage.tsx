import { useEffect, useState } from "react";
import { storeApi } from "../services/api";

const AdminStoresPage = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.list()
      .then((res) => setStores(res.data?.stores || res.data?.data || []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-8">Stores Management</h1>
      {loading ? <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store: any) => (
            <div key={store.id || store._id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">{store.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${store.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {store.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <p className="text-sm text-slate-500">{store.address}, {store.city}</p>
              <p className="text-sm text-slate-500 mt-1">Pincode: {store.pincode}</p>
              <div className="flex gap-4 text-xs text-slate-400 mt-3">
                <span>⭐ {store.rating}</span>
                <span>📦 {store.totalReviews} reviews</span>
                <span>🚴 {store.deliveryRadiusKm}km radius</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && stores.length === 0 && <p className="text-center py-12 text-slate-400">No stores yet. Seed the database first.</p>}
    </div>
  );
};
export default AdminStoresPage;
