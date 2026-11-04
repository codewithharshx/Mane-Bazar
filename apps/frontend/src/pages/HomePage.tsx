import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { BrandLogo } from "../components/BrandLogo";
import {
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  Flame,
  PackageCheck,
  ShoppingCart,
  MapPin,
  Award,
  Store,
} from "lucide-react";

const CATEGORY_AVATARS: Record<string, { icon: string; bg: string }> = {
  "dairy-products": { icon: "🥛", bg: "from-blue-50 to-indigo-50 text-blue-700" },
  "rice-grains": { icon: "🌾", bg: "from-amber-50 to-yellow-50 text-amber-700" },
  "atta-flour": { icon: "🍞", bg: "from-orange-50 to-amber-50 text-orange-700" },
  "pulses-dal": { icon: "🫘", bg: "from-emerald-50 to-green-50 text-emerald-700" },
  "cooking-oil-ghee": { icon: "🍳", bg: "from-yellow-50 to-amber-50 text-yellow-800" },
  "spices-masala": { icon: "🧂", bg: "from-rose-50 to-red-50 text-rose-700" },
  "packaged-foods": { icon: "🥫", bg: "from-slate-50 to-slate-100 text-slate-700" },
  "snacks-biscuits": { icon: "🍿", bg: "from-pink-50 to-rose-50 text-pink-700" },
  beverages: { icon: "🧃", bg: "from-teal-50 to-cyan-50 text-teal-700" },
  "dry-fruits-nuts": { icon: "🥜", bg: "from-amber-50 to-orange-50 text-amber-900" },
  "household-essentials": { icon: "🧹", bg: "from-sky-50 to-blue-50 text-sky-700" },
  "personal-care": { icon: "🧴", bg: "from-purple-50 to-violet-50 text-purple-700" },
};

const HomePage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Flash sales countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 12 });

  const { cartCount, subtotal, setDrawerOpen, addToCart } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 45, seconds: 12 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      categoryApi.list().catch(() => ({ data: { categories: [] } })),
      productApi.list({ limit: 40 }).catch(() => ({ data: { products: [] } })),
    ])
      .then(([catRes, prodRes]) => {
        if (!isMounted) return;
        const fetchedCats = catRes.data?.categories || catRes.data?.data || [];
        const fetchedProds = prodRes.data?.products || prodRes.data?.data || [];
        setCategories(fetchedCats);
        setProducts(fetchedProds);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered products for the interactive category tabs
  const filteredProducts = useMemo(() => {
    if (activeTab === "all") return products;
    const cat = categories.find((c) => c.slug === activeTab);
    if (!cat) return products;
    return products.filter((p) => p.categoryId === cat.id);
  }, [activeTab, products, categories]);

  // Flash deals (products with discount > 0)
  const flashDeals = useMemo(() => {
    return products.filter((p) => (p.discount || 0) > 0).slice(0, 4);
  }, [products]);

  // Lead deal item for hero floating card
  const heroDealItem = products[0] || null;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* ══════════════════════════════════════════════════════════════════
          1. STITCH MCP ULTRA-PREMIUM HERO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden hero-gradient border-b border-slate-100/80 pt-8 pb-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Provenance & Express Delivery Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50/90 border border-amber-300/80 px-4 py-1.5 text-xs font-bold text-amber-900 shadow-sm backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-hindi text-rose-600 font-extrabold">माने बाज़ार</span>
                <span className="text-amber-400">•</span>
                <span className="text-amber-800 font-extrabold">SINCE 1984</span>
                <span className="text-amber-400">•</span>
                <Zap size={13} className="text-emerald-600" />
                <span className="text-slate-700 font-medium hidden sm:inline">30-Min Fast Delivery in Kasegaon &amp; Sangli</span>
                <span className="text-slate-700 font-medium sm:hidden">30-Min Delivery</span>
              </div>

              {/* Main Headline */}
              <div>
                <p className="font-hindi text-rose-600 font-bold text-base sm:text-lg tracking-wide mb-1 flex items-center gap-2">
                  <span>विश्वास आणि दर्जाची ४० वर्षे</span>
                  <span className="text-amber-500 text-xs">★</span>
                </p>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  Authentic groceries, delivered{" "}
                  <span className="text-green-gradient">in minutes.</span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
                Shop pure kitchen staples, sealed flours, unadulterated oils, spices, dairy and daily household necessities from Kasegaon's legendary kirana store. 100% packaged grocery assurance with real PDF tax invoices.
              </p>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-7 py-4 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                >
                  <span>Start Shopping</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-bold text-slate-700 hover:bg-white hover:border-slate-300 shadow-sm backdrop-blur-sm transition-all active:scale-95"
                >
                  <span>Our Kirana Stores</span>
                </Link>
              </div>

              {/* Key Trust Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200/60">
                <div>
                  <p className="text-2xl font-black text-green-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    30 Min
                  </p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Express Delivery
                  </p>
                </div>
                <div className="border-l border-slate-200/80 pl-4">
                  <p className="text-2xl font-black text-green-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    360+
                  </p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Verified SKUs
                  </p>
                </div>
                <div className="border-l border-slate-200/80 pl-4">
                  <p className="text-2xl font-black text-green-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    4.9 ★
                  </p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Customer Rating
                  </p>
                </div>
                <div className="border-l border-slate-200/80 pl-4">
                  <p className="text-2xl font-black text-green-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    ₹0 Fee
                  </p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                    Above ₹499
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Stitch Interactive Floating 3D Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Radial backdrop aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/20 to-green-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

              <div className="w-full max-w-md space-y-4 py-4">
                {/* 1. Live Order Tracking Card */}
                <div className="glass-panel p-5 rounded-3xl shadow-card border border-white/90 animate-float">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚴</span>
                      <span className="text-xs font-bold text-slate-800">Your order is on the way</span>
                    </div>
                    <span className="text-xs font-extrabold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      75% • In 12m
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="green-gradient h-full rounded-full transition-all duration-1000" style={{ width: "75%" }} />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-medium">
                    <span>Dispatched from Sangli Kirana</span>
                    <span>Doorstep Delivery</span>
                  </div>
                </div>

                {/* 2. Hero Featured Deal Card */}
                {heroDealItem && (
                  <div className="glass-panel p-4 rounded-3xl shadow-card border border-white/90 translate-x-2 sm:translate-x-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-sm border border-slate-100 overflow-hidden flex-shrink-0">
                        <img
                          src={heroDealItem.image || heroDealItem.images?.[0]}
                          alt={heroDealItem.name}
                          className="h-full w-full object-cover rounded-xl"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                          ⚡ Limited Deal
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
                          {heroDealItem.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-extrabold text-green-700">
                            ₹{heroDealItem.price}
                          </span>
                          {heroDealItem.mrp > heroDealItem.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{heroDealItem.mrp}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(heroDealItem, 1)}
                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white p-2.5 shadow-sm transition-all active:scale-90 flex-shrink-0"
                        aria-label="Add deal item"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Cold-Chain & Fresh Promise Card */}
                <div
                  className="glass-panel p-4 rounded-3xl shadow-card border border-white/90 animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">100% Quality & Sealed Hygiene</h4>
                      <p className="text-[11px] text-slate-500">Handpicked batch stock from authorized kirana suppliers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. CATEGORY AISLES ("What are you looking for?")
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">
              Browse Aisles
            </p>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              What are you looking for?
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-green-700 hover:text-green-800 transition-colors"
          >
            <span>All Categories</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Circular Category Avatars (Stitch MCP Style) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const avatar = CATEGORY_AVATARS[cat.slug] || { icon: "🥫", bg: "from-slate-50 to-slate-100 text-slate-700" };
            return (
              <Link
                key={cat.id || cat.slug}
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1"
              >
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-br ${avatar.bg} border border-white/80 shadow-soft flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:shadow-card-hover transition-all duration-300`}
                >
                  <span className="select-none">{avatar.icon}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-green-700 transition-colors mt-2 leading-tight line-clamp-1 max-w-[84px]">
                  {cat.name.replace("& Grains", "").replace("& Flour", "")}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. FLASH DEALS SECTION WITH LIVE COUNTDOWN TIMER
      ══════════════════════════════════════════════════════════════════ */}
      {flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-[32px] bg-white border border-slate-200/80 p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Flame size={24} />
                </div>
                <div>
                  <h3
                    className="text-xl sm:text-2xl font-extrabold text-slate-900"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Flash Deals
                  </h3>
                  <p className="text-xs text-slate-500">Limited time daily price drops on pantry essentials</p>
                </div>
              </div>

              {/* Real-time Countdown clock */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ends In:</span>
                <div className="flex items-center gap-1 font-mono text-xs font-black">
                  <span className="bg-slate-900 text-white px-2 py-1 rounded-lg">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span>:</span>
                  <span className="bg-slate-900 text-white px-2 py-1 rounded-lg">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span>:</span>
                  <span className="bg-slate-900 text-white px-2 py-1 rounded-lg">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* Flash Deals Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {flashDeals.map((prod, idx) => (
                <ProductCard
                  key={prod.id || prod._id || idx}
                  product={prod}
                  index={idx}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. AUTHENTIC PHYSICAL KIRANA HERITAGE SHOWCASE (Since 1984)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-[36px] bg-gradient-to-br from-amber-500/10 via-white to-emerald-500/10 border border-amber-200/80 p-6 sm:p-10 shadow-card">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Left: Physical Storefront Vector Illustration from Photo */}
            <div className="lg:col-span-5 flex justify-center">
              <BrandLogo variant="storefront" className="max-w-md w-full" />
            </div>

            {/* Right: Heritage Kirana Story & Proof Points */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 border border-amber-300 px-3.5 py-1 text-xs font-bold text-amber-900">
                <Store size={14} className="text-amber-700" />
                <span>Visit In Person or Order Online</span>
              </div>

              <div className="space-y-1">
                <p className="font-hindi text-rose-600 font-black text-2xl sm:text-3xl tracking-tight">
                  माने बाज़ार • कासेगाव
                </p>
                <h3
                  className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  40 Years of Kirana Heritage • Serving Sangli Since 1984
                </h3>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Before fast-delivery apps existed, Mane Bazar was already the beating heart of daily groceries in Kasegaon. Today, we combine our physical storefront legacy with quick-commerce speed. Every pulse, grain, spice pack, and oil tin is personally inspected for batch freshness and authenticity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-sm">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 flex-shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Zero Produce Compromise</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Strictly packaged goods &amp; sealed staples. No wilted veggies or damaged perishables.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-slate-200/80 shadow-sm">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Registered Local Store</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Physical store in Kasegaon. GSTIN: 27AILPM4993G1ZZ. Real GST invoices.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <span>Explore Online Aisles</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Store size={14} className="text-amber-600" />
                  <span>Store Location Details</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. POPULAR PRODUCTS WITH INTERACTIVE CATEGORY TABS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">
              Curated Selection
            </p>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Popular Products
            </h2>
          </div>

          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Essentials
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveTab(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === cat.slug
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <SkeletonLoader count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod, idx) => (
              <ProductCard
                key={prod.id || prod._id || idx}
                product={prod}
                index={idx}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. DELIVERY PROMISE BENTO GRID (Stitch Haute Market Theme)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-[40px] bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-8 sm:p-14 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
              Mane Bazar Kirana Guarantee
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black leading-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Our Delivery Promise
            </h2>
            <p className="text-emerald-100/75 text-sm sm:text-base mt-3 leading-relaxed">
              We bridge traditional neighborhood kirana trust with precision logistics. Every delivery is handled with care directly from verified Sangli merchants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                Cold-Chain & Sealed Packs
              </h3>
              <p className="text-emerald-100/70 text-xs sm:text-sm mt-2 leading-relaxed">
                Strict hygiene and temperature control for dairy, butter, and packaged foods. No opened or damaged boxes.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                Guaranteed Time Slots
              </h3>
              <p className="text-emerald-100/70 text-xs sm:text-sm mt-2 leading-relaxed">
                Pick morning (7-10 AM), midday (10-1 PM), or evening (5-8 PM) delivery slots that fit your daily household routine.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4">
                <PackageCheck size={24} />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                100% Real Tax Invoices
              </h3>
              <p className="text-emerald-100/70 text-xs sm:text-sm mt-2 leading-relaxed">
                Every purchase receives an instant, downloadable PDF GST invoice streamed straight from our backend services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. MOBILE FLOATING CART BAR (Stitch Style)
      ══════════════════════════════════════════════════════════════════ */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="glass-panel p-3.5 rounded-2xl shadow-xl border border-green-500/30 flex items-center justify-between bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <ShoppingCart size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"} in Cart
                </span>
                <span className="block text-sm font-black text-green-700">₹{subtotal}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="green-gradient text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>View Cart</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          7. QUICK VIEW MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
