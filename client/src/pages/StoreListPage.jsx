import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { storeApi } from "../services/storeApi";
import PageTransition from "../components/PageTransition";
import SkeletonLoader from "../components/SkeletonLoader";

const DEFAULT_COORDS = { lat: 17.2898, lng: 74.1492 };

const StoreListPage = () => {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [radius, setRadius] = useState(10);
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        toast("Using Kasegaon location as fallback");
      },
      { timeout: 6000 }
    );
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius: String(radius),
      limit: "20"
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return params.toString();
  }, [coords, radius, search]);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const { data } = await storeApi.nearby(Object.fromEntries(new URLSearchParams(queryString)));
        setStores(data.stores || []);
      } catch (error) {
        toast.error("Unable to load nearby stores");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [queryString]);

  return (
    <PageTransition className="section-shell space-y-7 py-5">
      <div className="rounded-[30px] bg-white/80 p-6 shadow-soft backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
          Nearby stores
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
          Discover local grocery stores around you
        </h1>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search store name, category, city"
            className="input-field"
          />
          <select
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="input-field"
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={15}>Within 15 km</option>
            <option value={25}>Within 25 km</option>
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <SkeletonLoader key={index} className="h-72" />
            ))
          : stores.map((store) => (
              <Link
                key={store._id}
                to={`/stores/${store._id}`}
                className="group overflow-hidden rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-soft"
              >
                <img
                  src={store.images?.[0]}
                  alt={store.name}
                  className="h-44 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{store.name}</h2>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {store.rating || 0} ★
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{store.address}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        store.isOpen
                          ? "bg-green-100 text-green-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {store.isOpen ? "Open now" : "Closed"}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {store.distanceKm || 0} km away
                    </span>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {!loading && stores.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white/70 p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">No stores found in this area</h2>
          <p className="mt-2 text-slate-500">Try increasing radius or changing your search.</p>
        </div>
      ) : null}
    </PageTransition>
  );
};

export default StoreListPage;
