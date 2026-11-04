import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  PackageCheck,
  ShoppingCart,
  Award,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";

// Clean, high-fidelity category styling for quick-commerce navigation
const CATEGORY_STYLES: Record<string, { icon: string; bg: string; text: string }> = {
  "dairy-products": { icon: "🥛", bg: "bg-blue-50 hover:bg-blue-100/80 border-blue-200/60", text: "text-blue-900" },
  "atta-flour": { icon: "🌾", bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-200/60", text: "text-amber-900" },
  "rice-grains": { icon: "🍚", bg: "bg-yellow-50 hover:bg-yellow-100/80 border-yellow-200/60", text: "text-yellow-900" },
  "pulses-dal": { icon: "🫘", bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/60", text: "text-emerald-900" },
  "cooking-oil-ghee": { icon: "🍳", bg: "bg-orange-50 hover:bg-orange-100/80 border-orange-200/60", text: "text-orange-900" },
  "spices-masala": { icon: "🧂", bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-200/60", text: "text-rose-900" },
  "packaged-foods": { icon: "🥫", bg: "bg-slate-50 hover:bg-slate-100/80 border-slate-200/60", text: "text-slate-900" },
  "snacks-biscuits": { icon: "🍿", bg: "bg-pink-50 hover:bg-pink-100/80 border-pink-200/60", text: "text-pink-900" },
  beverages: { icon: "🧃", bg: "bg-teal-50 hover:bg-teal-100/80 border-teal-200/60", text: "text-teal-900" },
  "dry-fruits-nuts": { icon: "🥜", bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-200/60", text: "text-amber-900" },
  "household-essentials": { icon: "🧹", bg: "bg-sky-50 hover:bg-sky-100/80 border-sky-200/60", text: "text-sky-900" },
  "personal-care": { icon: "🧴", bg: "bg-purple-50 hover:bg-purple-100/80 border-purple-200/60", text: "text-purple-900" },
};

const HomePage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Flash sales ticking countdown timer
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
      categoryApi.list().catch(() => ({ data: [] })),
      productApi.list({ limit: 40 }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([catRes, prodRes]) => {
        if (!isMounted) return;

        // Correctly handle Array response from /api/categories
        const fetchedCats = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.categories || catRes.data?.data || [];

        // Correctly handle data object from /api/products
        const fetchedProds = Array.isArray(prodRes.data?.data)
          ? prodRes.data.data
          : Array.isArray(prodRes.data?.products)
          ? prodRes.data.products
          : Array.isArray(prodRes.data)
          ? prodRes.data
          : [];

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

  // Lead deal item for hero spotlight
  const leadDealItem = products[0] || null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* ══════════════════════════════════════════════════════════════════
          1. BLINKIT-GRADE QUICK-COMMERCE HERO BENTO GRID
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Hero Banner (8 Columns) */}
          <div className="lg:col-span-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-10 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[340px]">
            {/* Background Decorative Rings */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-xl">
              {/* Heritage provenance pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 text-xs font-semibold text-emerald-200">
                <span className="font-hindi text-rose-300 font-extrabold">माने बाज़ार</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">ESTD. 1984</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-white">
                  <Zap size={12} className="text-emerald-400" />
                  15-Min Delivery
                </span>
              </div>

              {/* Punchy Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12]">
                Superfast grocery delivery at{" "}
                <span className="text-emerald-300">Kirana prices.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed">
                Directly from Kasegaon's legendary kirana store. Pure grains, unadulterated oils, sealed flours, fresh dairy, and daily essentials with verified GST invoices.
              </p>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-emerald-900 px-6 py-3.5 text-xs sm:text-sm font-extrabold shadow-md hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <span>Shop Today's Essentials</span>
                  <ArrowRight size={16} className="text-emerald-700" />
                </Link>
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 px-5 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all active:scale-95"
                >
                  <span>Our Stores</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar at Base of Banner */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/15 text-xs font-semibold text-emerald-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-700/60 text-emerald-300">
                  <Zap size={14} />
                </div>
                <span>15-Min Express</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-700/60 text-emerald-300">
                  <ShieldCheck size={14} />
                </div>
                <span>100% Sealed Packs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-700/60 text-emerald-300">
                  <PackageCheck size={14} />
                </div>
                <span>GST Tax Invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-700/60 text-emerald-300">
                  <Award size={14} />
                </div>
                <span>40 Years of Trust</span>
              </div>
            </div>
          </div>

          {/* Right Side Bento Column (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Card 1: Flash Deal Spotlight */}
            {leadDealItem ? (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                      <Flame size={13} />
                      Daily Deal
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500">
                      <Clock size={12} />
                      <span>{String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 p-1.5 flex-shrink-0 border border-slate-100">
                      <img
                        src={leadDealItem.image || leadDealItem.images?.[0]}
                        alt={leadDealItem.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{leadDealItem.brand}</p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">{leadDealItem.name}</h4>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-base font-black text-slate-900">₹{leadDealItem.price}</span>
                        {leadDealItem.mrp > leadDealItem.price && (
                          <span className="text-xs text-slate-400 line-through">₹{leadDealItem.mrp}</span>
                        )}
                        <span className="text-[11px] font-extrabold text-emerald-600">
                          {leadDealItem.discount}% OFF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(leadDealItem, 1)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart size={14} />
                  <span>Add to Cart</span>
                </button>
              </div>
            ) : null}

            {/* Card 2: Kirana Guarantee Pill */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Packaged Grocery Guarantee
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    100% sealed packets, unadulterated grains, and verified batch dates. Zero raw or damaged produce.
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-800">
                <span>📍 Kasegaon Main Hub</span>
                <span>GSTIN: 27AILPM4993G1ZZ</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. SHOP BY CATEGORY (All 12 Verified Categories)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Explore Aisles
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>See All Products</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const style = CATEGORY_STYLES[cat.slug] || {
              icon: "🥫",
              bg: "bg-slate-50 hover:bg-slate-100 border-slate-200/60",
              text: "text-slate-900",
            };
            return (
              <Link
                key={cat.id || cat.slug}
                to={`/products?category=${cat.slug}`}
                className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${style.bg}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="select-none">{style.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold leading-snug line-clamp-2 ${style.text}`}>
                    {cat.name}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium group-hover:text-emerald-700 transition-colors">
                    Shop now →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. FLASH DEALS CAROUSEL / GRID WITH LIVE TIMER
      ══════════════════════════════════════════════════════════════════ */}
      {flashDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                  <Flame size={22} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    Flash Deals
                  </h3>
                  <p className="text-xs text-slate-500">Limited-time price drops on high-demand essentials</p>
                </div>
              </div>

              {/* Countdown Clock */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ends In:</span>
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

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
          4. POPULAR PRODUCTS (With Zero-Reload Category Filter Tabs)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Curated Staples
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Popular Groceries
            </h2>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Essentials
            </button>
            {categories.slice(0, 7).map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveTab(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === cat.slug
                    ? "bg-emerald-600 text-white shadow-xs"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
          5. AUTHENTIC KIRANA HERITAGE & TRUST BANNER (Since 1984)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-7 sm:p-10 shadow-xl relative overflow-hidden">
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Story */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-amber-300">
                <Sparkles size={13} />
                <span>Kasegaon's Neighborhood Heritage • Since 1984</span>
              </div>

              <div className="space-y-1">
                <p className="font-hindi text-rose-400 font-black text-2xl tracking-tight">
                  माने बाज़ार • कासेगाव
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  40 Years of Kirana Trust. Now at Quick-Commerce Speed.
                </h3>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Founded over four decades ago, Mane Bazar serves thousands of families across Sangli. We partner directly with authorized food grain millers, spice grinders, and national FMCG brands. Every packet delivered is personally inspected for batch freshness and authentic MRP.
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={15} />
                  Main Road, Kasegaon
                </span>
                <span>•</span>
                <span className="font-mono text-amber-200">GSTIN: 27AILPM4993G1ZZ</span>
              </div>
            </div>

            {/* Right Trust Pillars (2x2 Grid) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="text-xs font-bold text-white">Zero Produce Compromise</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">Strictly packaged goods &amp; sealed staples. No wilted vegetables.</p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                  <PackageCheck size={18} />
                </div>
                <h4 className="text-xs font-bold text-white">Official Tax Invoices</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">Instant downloadable PDF GST invoice with every single order.</p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                  <Clock size={18} />
                </div>
                <h4 className="text-xs font-bold text-white">15-Min Fast Dispatch</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">Orders packed in 5 minutes and dispatched from our local hub.</p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                  <Award size={18} />
                </div>
                <h4 className="text-xs font-bold text-white">Kirana MRP Savings</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">Direct manufacturer prices with daily discount vouchers.</p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. MOBILE FLOATING CART PILL
      ══════════════════════════════════════════════════════════════════ */}
      {cartCount > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="p-3.5 rounded-2xl shadow-xl bg-slate-900 text-white flex items-center justify-between border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <ShoppingCart size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"} in Cart
                </span>
                <span className="block text-sm font-black text-emerald-400">₹{subtotal}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
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
