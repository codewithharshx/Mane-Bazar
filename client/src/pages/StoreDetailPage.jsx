import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { productApi } from "../services/productApi";
import { storeApi } from "../services/storeApi";
import PageTransition from "../components/PageTransition";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";
import { MapPin, Clock, Phone, MessageCircle, Star, ShieldCheck, ChevronRight } from "lucide-react";

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const { isAuthenticated } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });
  const [savingReview, setSavingReview] = useState(false);

  // Dynamic Open/Closed status logic
  const storeStatus = useMemo(() => {
    if (!store) return { isOpen: false, text: "Closed" };
    
    const now = new Date();
    const day = now.getDay(); // 0-6 (Sun-Sat)
    const time = now.getHours() * 100 + now.getMinutes();
    
    let openTime, closeTime;
    
    // Sat: 8:30 AM - 1:00 PM (13:00)
    if (day === 6) { 
      openTime = 830;
      closeTime = 1300;
    } else { 
      // Mon-Fri & Sun: 7:30 AM - 8:00 PM (20:00)
      openTime = 730;
      closeTime = 2000;
    }
    
    const isOpen = time >= openTime && time < closeTime;
    return {
      isOpen,
      text: isOpen ? "Open Now" : "Currently Closed",
      color: isOpen ? "text-green-600 bg-green-50 border-green-100" : "text-rose-600 bg-rose-50 border-rose-100"
    };
  }, [store]);

  const mapHref = useMemo(() => {
    if (!store?.location?.coordinates?.length) return "#";
    const [lng, lat] = store.location.coordinates;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }, [store]);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const [{ data: storeData }, { data: productData }] = await Promise.all([
        storeApi.getById(storeId),
        productApi.list({ store: storeId, limit: 16 })
      ]);
      setStore(storeData);
      setProducts(productData.products || []);
    } catch (error) {
      toast.error("Unable to load store details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [storeId]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to post a review");
      return;
    }

    setSavingReview(true);
    try {
      await storeApi.createReview(storeId, {
        rating: Number(reviewForm.rating),
        review: reviewForm.review
      });
      toast.success("Review saved");
      setReviewForm({ rating: 5, review: "" });
      fetchStore();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save review");
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="section-shell space-y-8 py-10">
        <SkeletonLoader className="h-96 rounded-[40px]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonLoader className="h-60" />
          <SkeletonLoader className="h-60" />
        </div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <PageTransition className="section-shell space-y-12 pb-20 pt-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-white p-2 shadow-xl shadow-slate-200/40">
        <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative h-[480px] overflow-hidden rounded-[32px]">
            <img 
              src={store.images?.[0]} 
              alt={store.name} 
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-10 left-10 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg">
                <ShieldCheck size={14} /> Official Store
              </div>
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight md:text-6xl">{store.name}</h1>
              <div className="mt-4 flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1.5 font-bold">
                  <Star size={18} className="fill-amber-400 text-amber-400" />
                  <span>{store.rating || 0}</span>
                </div>
                <div className="h-4 w-[1px] bg-white/30" />
                <p>{store.city}</p>
              </div>
            </div>
          </div>
          <div className="grid h-[480px] grid-rows-2 gap-2">
            <img 
              src={store.images?.[1]} 
              alt="Store Interior" 
              className="h-full w-full rounded-[32px] object-cover transition duration-700 hover:scale-105"
            />
            <div className="grid grid-cols-2 gap-2">
              <img 
                src={store.images?.[2]} 
                alt="Store Product Shelf" 
                className="h-full w-full rounded-[32px] object-cover transition duration-700 hover:scale-105"
              />
              <div className="relative flex flex-col items-center justify-center rounded-[32px] bg-emerald-600 text-white shadow-inner">
                  <p className="text-4xl font-extrabold leading-none">{store.totalReviews || 0}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">Store Reviews</p>
                  <ChevronRight size={20} className="mt-4 opacity-40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info & Products Grid */}
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-16">
          {/* About Section */}
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-slate-100 pb-10">
            <div className="flex-1 min-w-[300px]">
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight brand-font italic">
                Neighborhood trusted. <br />
                <span className="text-green-600">Daily essentials delivered.</span>
              </h2>
              <p className="mt-5 text-lg text-slate-500 leading-relaxed font-medium">
                {store.description}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 pt-2">
              <div className={`flex items-center gap-2 rounded-2xl border px-6 py-3 font-bold shadow-sm ${storeStatus.color}`}>
                <Clock size={20} /> {storeStatus.text}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Regular hours: 7:30 AM - 8:00 PM</p>
            </div>
          </div>

          {/* Product Feed */}
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Available in Store</h3>
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 border border-slate-100">
                <ChevronRight size={20} />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  onQuickView={setQuickViewProduct}
                />
              ))}
              {!products.length && (
                <div className="col-span-full py-20 text-center rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200">
                  <p className="font-bold text-slate-400 uppercase tracking-widest">No products listed yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-[32px] bg-slate-50 p-8 border border-slate-100">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-green-600 mb-6">
               <MapPin size={24} />
             </div>
             <h4 className="text-xl font-bold text-slate-900">Locate Us</h4>
             <p className="mt-3 text-slate-500 leading-relaxed font-medium">
               {store.address}<br/>
               {store.city} - {store.pincode}
             </p>
             <a 
               href={mapHref}
               target="_blank"
               rel="noreferrer"
               className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800"
             >
               Open Maps <ChevronRight size={18} />
             </a>
          </div>

          <div className="rounded-[32px] bg-white p-8 border border-slate-100 shadow-sm">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 shadow-sm text-emerald-600 mb-6">
               <Phone size={24} />
             </div>
             <h4 className="text-xl font-bold text-slate-900">Get in Touch</h4>
             <p className="mt-3 text-slate-500 leading-relaxed font-medium">
               Call or message for bulk orders and delivery tracking.
             </p>
             <div className="mt-8 flex gap-3">
               <a href={`tel:${store.phone}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition hover:bg-green-100 hover:text-green-700">
                 <Phone size={22} />
               </a>
               <a 
                 href={`https://wa.me/${store.whatsapp?.replace(/\D/g, '')}`} 
                 target="_blank" 
                 rel="noreferrer" 
                 className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition hover:bg-emerald-100 hover:text-emerald-700"
                >
                 <MessageCircle size={22} />
               </a>
               <div className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-green-600 font-bold text-white shadow-lg shadow-green-500/20">
                 Support
               </div>
             </div>
          </div>
        </div>
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </PageTransition>
  );
};

export default StoreDetailPage;
