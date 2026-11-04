import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { storeApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { MapPin, Star, Clock, ShoppingCart } from "lucide-react";

const StoreDetailPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!storeId) return;
    Promise.all([
      storeApi.getById(storeId),
      storeApi.products(storeId),
    ]).then(([storeRes, prodRes]) => {
      setStore(storeRes.data?.store || storeRes.data);
      setProducts(prodRes.data?.products || prodRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse"><div className="h-48 bg-slate-100 rounded-3xl mb-6" /></div>;
  if (!store) return <div className="text-center py-20 text-slate-500">Store not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">{store.name}</h1>
        {store.description && <p className="text-white/80 mb-4">{store.description}</p>}
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1"><MapPin size={14} /> {store.address}, {store.city}</span>
          <span className="flex items-center gap-1"><Star size={14} fill="currentColor" /> {store.rating}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {store.estimatedDeliveryMin}-{store.estimatedDeliveryMax} min</span>
          <span className={`font-semibold ${store.isOpen ? "text-green-300" : "text-red-300"}`}>{store.isOpen ? "● Open Now" : "● Closed"}</span>
        </div>
      </div>
      <h2 className="font-display text-xl font-bold mb-4">Products from {store.name}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <div key={product.id || product._id} className="bg-white rounded-2xl border border-slate-100 hover:shadow-card-hover transition-all overflow-hidden">
            <div className="aspect-square bg-slate-50">
              <img src={product.images?.[0] || product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-slate-800 line-clamp-1">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-green-700">₹{product.price}</span>
                <button onClick={() => addToCart({ ...product, _id: product.id || product._id })}
                  className="w-8 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors">
                  <ShoppingCart size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && <p className="text-center text-slate-500 py-8">No products from this store yet.</p>}
    </div>
  );
};
export default StoreDetailPage;
