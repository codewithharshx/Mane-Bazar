import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "../services/categoryApi";
import { productApi } from "../services/productApi";
import { storeApi } from "../services/storeApi";
import HeroSlider from "../components/HeroSlider";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import OfferStrip from "../components/OfferStrip";
import TrustBadges from "../components/TrustBadges";
import { ProductCardSkeleton } from "../components/SkeletonLoader";
import PageTransition from "../components/PageTransition";
import { useGeolocation } from "../hooks/useGeolocation";

/* ── View-all button ─────────────────────────────────────────────── */
const ViewAllBtn = ({ to, label = "View all →" }) => (
  <Link
    to={to}
    className="flex-shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-green-400 hover:text-green-600 transition-all duration-200 shadow-sm"
  >
    {label}
  </Link>
);

/* ── Section header ─────────────────────────────────────────────── */
const SectionHeader = ({ eyebrow, eyebrowColor = "text-green-700", title, to }) => (
  <div className="mb-7 flex items-end justify-between gap-4">
    <div>
      <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${eyebrowColor}`}>{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl" style={{ fontFamily: "Outfit, sans-serif" }}>
        {title}
      </h2>
    </div>
    {to && <ViewAllBtn to={to} />}
  </div>
);

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { location: userCoords, loading: geoLoading } = useGeolocation();

  // Only fetch once after geo resolves (prevents re-fetch on coord refinement)
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (geoLoading) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const lat = userCoords?.lat;
    const lng = userCoords?.lng;

    const fetchHomeData = async () => {
      try {
        setError("");
        const [{ data: categoryData }, { data: productData }, { data: bestData }] =
          await Promise.all([
            categoryApi.list(),
            productApi.list({ limit: 8, sort: "newest" }),
            productApi.list({ limit: 8, sort: "popular" })
          ]);

        setCategories(categoryData);
        setProducts(productData.products ?? []);
        setBestSellers(bestData.products ?? []);

        if (lat && lng) {
          try {
            const { data: storesData } = await storeApi.nearby({ lat, lng, radius: 25, limit: 6 });
            setNearbyStores(storesData.stores ?? []);
          } catch {
            setNearbyStores([]);
          }
        }
      } catch (err) {
        setError("Unable to load home data right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [geoLoading]);

  return (
    <PageTransition className="space-y-14 pb-10">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="section-shell pt-3">
        <HeroSlider />
      </section>

      {/* ── Offer strip ───────────────────────────────────────────── */}
      <section className="section-shell">
        <OfferStrip />
      </section>

      {/* ── Trust badges ──────────────────────────────────────────── */}
      <section className="section-shell">
        <TrustBadges />
      </section>

      {!loading && error ? (
        <section className="section-shell">
          <div className="card-surface border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        </section>
      ) : null}

      {/* ── Nearby stores ─────────────────────────────────────────── */}
      {(loading || nearbyStores.length > 0) && (
        <section className="section-shell">
          <SectionHeader
            eyebrow="Near you"
            eyebrowColor="text-emerald-700"
            title="Trusted local stores in your area"
            to="/stores"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-60 rounded-3xl" />
                ))
              : nearbyStores.map((store) => (
                  <Link
                    key={store._id}
                    to={`/stores/${store._id}`}
                    className="group card-surface flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="overflow-hidden rounded-t-3xl">
                      <img
                        src={store.images?.[0]}
                        alt={store.name}
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                          {store.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {store.distanceKm ? `${store.distanceKm} km away · ` : ""}{store.city}
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {store.rating || 4.5} ⭐
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      )}

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="section-shell">
        <SectionHeader
          eyebrow="Shop by aisle"
          eyebrowColor="text-green-700"
          title="Grocery categories for daily shopping"
          to="/products"
        />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-44 rounded-3xl" />
              ))
            : categories.map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
        </div>
      </section>

      {/* ── Best Sellers ──────────────────────────────────────────── */}
      {(loading || bestSellers.length > 0) && (
        <section className="section-shell">
          <SectionHeader
            eyebrow="Best sellers"
            eyebrowColor="text-amber-600"
            title="Top picks from Mane Bazar"
            to="/products?sort=popular"
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : bestSellers.map((product, index) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    index={index}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
          </div>
        </section>
      )}

      {/* ── Fresh Arrivals ─────────────────────────────────────────── */}
      <section className="section-shell">
        <SectionHeader
          eyebrow="Fresh arrivals"
          eyebrowColor="text-orange-600"
          title="Fast-moving essentials, just landed"
          to="/products"
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  onQuickView={setQuickViewProduct}
                />
              ))}
        </div>
      </section>

      {/* ── Features dark strip ─────────────────────────────────────── */}
      <section className="section-shell">
        <div
          className="grid gap-5 rounded-4xl p-8 md:p-10 text-white md:grid-cols-3"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
        >
          {[
            { icon: "⚡", title: "Same-day delivery slots", desc: "Choose morning, afternoon, or evening delivery based on your routine." },
            { icon: "🧾", title: "Real PDF invoices", desc: "Every order gets a proper invoice ready for download and accounting." },
            { icon: "💰", title: "Neighbourhood pricing", desc: "Built for real grocery margins — discounts, coupons, and COD support." }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/8 p-6 hover:bg-white/12 transition-colors backdrop-blur-sm">
              <div className="text-3xl mb-3 select-none">{item.icon}</div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </PageTransition>
  );
};

export default HomePage;
