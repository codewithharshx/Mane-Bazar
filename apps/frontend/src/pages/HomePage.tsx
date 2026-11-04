import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../services/api";
import HeroSlider from "../components/HeroSlider";
import OfferStrip from "../components/OfferStrip";
import TrustBadges from "../components/TrustBadges";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";

const ArrowRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const HomePage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      categoryApi.list().catch(() => ({ data: { categories: [] } })),
      productApi.list({ limit: 12, sort: "featured" }).catch(() => ({ data: { products: [] } })),
      productApi.list({ limit: 8, sort: "popular" }).catch(() => ({ data: { products: [] } })),
    ])
      .then(([catRes, featuredRes, bestRes]) => {
        if (!isMounted) return;
        const fetchedCats = catRes.data?.categories || catRes.data?.data || [];
        const fetchedFeatured = featuredRes.data?.products || featuredRes.data?.data || [];
        const fetchedBest = bestRes.data?.products || bestRes.data?.data || [];

        setCategories(fetchedCats);
        setFeaturedProducts(fetchedFeatured);
        setBestSellers(fetchedBest.length > 0 ? fetchedBest : fetchedFeatured.slice(0, 4));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ── Authentic Hero Slider ────────────────────────────────────── */}
      <HeroSlider />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 mt-6">
        {/* ── Promotional Offers Strip ───────────────────────────────── */}
        <section aria-label="Promotional Categories">
          <OfferStrip />
        </section>

        {/* ── Trust Badges ───────────────────────────────────────────── */}
        <section aria-label="Why Choose Mane Bazar">
          <TrustBadges />
        </section>

        {/* ── Category Showcase ──────────────────────────────────────── */}
        <section aria-label="Product Categories">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Explore The Aisles
              </p>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Shop by Category
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              <span>All Categories</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat, idx) => (
                <CategoryCard key={cat.id || cat.slug || idx} category={cat} index={idx} />
              ))}
            </div>
          )}
        </section>

        {/* ── Best Sellers ───────────────────────────────────────────── */}
        <section aria-label="Best Sellers">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Customer Favorites
              </p>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Popular Staples
              </h2>
            </div>
            <Link
              to="/products?sort=popular"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              <span>View All</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={4} />
          ) : bestSellers.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 bg-white">
              <p className="text-slate-500">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((prod, idx) => (
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

        {/* ── Kirana Promise Strip ───────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-900 via-green-900 to-slate-950 p-8 sm:p-12 text-white shadow-xl">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 grid gap-8 md:grid-cols-3 items-center">
            <div className="md:col-span-2 space-y-3">
              <span className="inline-block rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                Mane Bazar Guarantee
              </span>
              <h3
                className="text-2xl sm:text-4xl font-extrabold leading-tight"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Neighborhood Kirana Trust, Modern Convenience
              </h3>
              <p className="text-emerald-100/80 text-sm sm:text-base leading-relaxed max-w-xl">
                Every grocery item is handpicked from certified distributors, packed with care in hygienic conditions, and delivered to your doorstep with full GST tax invoices.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 hover:bg-emerald-50 transition-all shadow-md"
              >
                <span>Start Shopping</span>
                <ArrowRightIcon />
              </Link>
              <Link
                to="/stores"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                <span>Store Locations</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Featured Pantry Essentials ─────────────────────────────── */}
        <section aria-label="Featured Essentials">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                Pantry Staples
              </p>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Daily Essentials
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              <span>Explore All ({featuredProducts.length})</span>
              <ArrowRightIcon />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader count={8} />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 bg-white">
              <p className="text-slate-500">Products are currently loading.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((prod, idx) => (
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
      </div>

      {/* ── Quick View Modal ────────────────────────────────────────── */}
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
