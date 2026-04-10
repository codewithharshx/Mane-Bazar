import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import HeroSlider from "../components/HeroSlider";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import PageTransition from "../components/PageTransition";
import { useGeolocation } from "../hooks/useGeolocation";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { location: userCoords, loading: geoLoading } = useGeolocation();

  useEffect(() => {
    if (geoLoading) return;

    const fetchHomeData = async () => {
      try {
        const [{ data: categoryData }, { data: productData }] = await Promise.all([
          api.get("/categories"),
          api.get("/products?limit=8")
        ]);

        setCategories(categoryData);
        setProducts(productData.products || []);

        // Nearby stores — non-fatal if it fails
        try {
          const { data: storesData } = await api.get(
            `/stores/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=25&limit=6`
          );
          setNearbyStores(storesData.stores || []);
        } catch {
          setNearbyStores([]);
        }
      } catch (err) {
        console.error("Home data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [geoLoading, userCoords.lat, userCoords.lng]);

  return (
    <PageTransition className="space-y-14">
      {/* Hero Slider */}
      <section className="section-shell pt-4">
        <HeroSlider />
      </section>

      {/* Nearby Stores */}
      {(loading || nearbyStores.length > 0) && (
        <section className="section-shell">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Near you
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                Trusted local stores in your area
              </h2>
            </div>
            <Link
              to="/stores"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonLoader key={i} className="h-60" />
                ))
              : nearbyStores.map((store) => (
                  <Link
                    key={store._id}
                    to={`/stores/${store._id}`}
                    className="group rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-soft transition-all duration-300 hover:shadow-glass hover:-translate-y-1"
                  >
                    <img
                      src={store.images?.[0]}
                      alt={store.name}
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                        {store.name}
                      </h3>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {store.rating || 0} ★
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{store.city}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {store.distanceKm ? `${store.distanceKm} km away` : "Local store"}
                    </p>
                  </Link>
                ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="section-shell">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            Shop by aisle
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            Grocery categories built for daily shopping
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <SkeletonLoader key={i} className="h-48" />
              ))
            : categories.map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
        </div>
      </section>

      {/* Products */}
      <section className="section-shell">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-600">
              Customer favourites
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Fast moving essentials from trusted Indian brands
            </h2>
          </div>
          <Link
            to="/products"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <SkeletonLoader key={i} className="h-[420px]" />
              ))
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

      {/* Features strip */}
      <section className="section-shell pb-10">
        <div className="grid gap-6 rounded-[36px] bg-slate-950 p-8 text-white md:grid-cols-3">
          {[
            {
              title: "Same-day delivery slots",
              desc: "Choose morning, afternoon, or evening delivery based on your routine."
            },
            {
              title: "Real PDF invoices",
              desc: "Every order gets a proper invoice ready for download and accounting."
            },
            {
              title: "Neighbourhood pricing",
              desc: "Built for real grocery margins — discounts, coupons, and COD support."
            }
          ].map((item) => (
            <div key={item.title} className="rounded-[28px] bg-white/10 p-6 hover:bg-white/15 transition-colors">
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </PageTransition>
  );
};

export default HomePage;
