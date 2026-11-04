import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storeApi } from "../services/api";
import { MapPin, Star, Clock } from "lucide-react";

const StoreListPage = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.list()
      .then((res) => setStores(res.data?.stores || res.data?.data || []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">Local Stores</h1>
      <p className="text-slate-500 mb-8">Shop from the best stores near you</p>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏪</div>
          <p className="text-slate-600 font-medium">No stores available yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store: any) => (
            <Link key={store.id || store._id} to={`/stores/${store.id || store._id}`}
              className="bg-white rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-card-hover transition-all overflow-hidden group">
              {store.images?.[0] && (
                <img src={store.images[0]} alt={store.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 mb-1">{store.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                  <MapPin size={12} /> {store.city}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-amber-500"><Star size={12} fill="currentColor" /> {store.rating || "4.5"}</span>
                  <span className="flex items-center gap-1 text-slate-500"><Clock size={12} /> {store.estimatedDeliveryMin || 10}-{store.estimatedDeliveryMax || 30} min</span>
                  <span className={`text-xs font-semibold ${store.isOpen ? "text-green-600" : "text-red-500"}`}>{store.isOpen ? "Open" : "Closed"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default StoreListPage;
