import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { categoryApi } from "../services/categoryApi";
import { productApi } from "../services/productApi";
import { storeApi } from "../services/storeApi";
import useDebounce from "../hooks/useDebounce";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { ProductCardSkeleton } from "../components/SkeletonLoader";
import PageTransition from "../components/PageTransition";

const PAGE_SIZE = 16;

const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
  { value: "name_asc", label: "Name: A → Z" }
];

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const SlidersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);
const XIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      store: searchParams.get("store") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || ""
    }),
    [searchParams]
  );

  const debouncedSearch = useDebounce(filters.search, 350);
  const filterKey = useMemo(
    () => JSON.stringify({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  useEffect(() => {
    const fetchFilterMeta = async () => {
      try {
        const [{ data: categoryData }, { data: storeData }] = await Promise.all([
          categoryApi.list(),
          storeApi.list({ limit: 50 })
        ]);
        setCategories(categoryData);
        setStores(storeData.stores ?? []);
      } catch {
        setCategories([]);
        setStores([]);
      }
    };
    fetchFilterMeta();
  }, []);

  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKey.current) {
      prevFilterKey.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  const fetchProducts = useCallback(
    async (pageNum) => {
      setLoading(true);
      setError("");
      try {
        const parsed = JSON.parse(filterKey);
        const queryParams = Object.fromEntries(
          Object.entries({ ...parsed, page: pageNum, limit: PAGE_SIZE }).filter(
            ([, v]) => v !== "" && v !== undefined
          )
        );
        const { data } = await productApi.list(queryParams);
        setProducts(data.data ?? data.products ?? []);
        setTotalPages(data.pages ?? data.pagination?.pages ?? 1);
      } catch (err) {
        setProducts([]);
        setError(err?.response?.data?.message ?? "Unable to load products right now");
      } finally {
        setLoading(false);
      }
    },
    [filterKey]
  );

  useEffect(() => { fetchProducts(page); }, [fetchProducts, page]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => setSearchParams({}, { replace: true });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  /* ── active filter chips ──────────────────────────────────────── */
  const activeChips = Object.entries(filters)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => ({ key: k, value: v }));

  return (
    <PageTransition className="section-shell space-y-7 py-5 pb-12">

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-green-900 to-emerald-800 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-green-300 mb-2">Browse products</p>
        <h1
          className="text-3xl font-extrabold leading-tight max-w-lg"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Everyday grocery essentials across pantry, dairy, snacks, and home care
        </h1>
      </div>

      {/* ── Search + filter bar ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft space-y-4">
        {/* Row 1: search + toggles */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search products or brands…"
              className="input-field pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersVisible((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              filtersVisible
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersIcon />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-black text-white">
                {activeChips.length}
              </span>
            )}
          </button>
          {/* Sort – always visible */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="input-field w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Row 2: extended filters (toggle) */}
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 pt-1 sm:grid-cols-2 xl:grid-cols-4">
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="input-field"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>

                <select
                  value={filters.store}
                  onChange={(e) => updateFilter("store", e.target.value)}
                  className="input-field"
                >
                  <option value="">All stores</option>
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>

                <input
                  value={filters.brand}
                  onChange={(e) => updateFilter("brand", e.target.value)}
                  placeholder="Brand"
                  className="input-field"
                />

                <div className="flex gap-2">
                  <input
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    placeholder="Min ₹"
                    type="number"
                    min="0"
                    className="input-field"
                  />
                  <input
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    placeholder="Max ₹"
                    type="number"
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">Active:</span>
            {activeChips.map(({ key, value }) => (
              <button
                key={key}
                type="button"
                onClick={() => updateFilter(key, "")}
                className="flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
              >
                {key}: {value}
                <XIcon />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results count ─────────────────────────────────────────── */}
      {!loading && !error && (
        <p className="text-sm text-slate-500 font-medium">
          {products.length === 0
            ? "No products found"
            : `Showing ${products.length} product${products.length !== 1 ? "s" : ""}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}`}
        </p>
      )}

      {/* ── Product grid ──────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                onQuickView={setQuickViewProduct}
              />
            ))}
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="font-semibold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchProducts(page)}
            className="mt-3 rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/75 py-16 text-center">
          <div className="text-5xl mb-4 select-none">🔍</div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            No matching products
          </h2>
          <p className="mt-2 text-slate-500 text-sm">Try adjusting your filters or search terms</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setPage(pg)}
                  className={`h-9 w-9 rounded-xl text-sm font-semibold transition-all ${
                    pg === page
                      ? "bg-green-600 text-white shadow-btn-green"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pg}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
          >
            Next →
          </button>
        </div>
      )}

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </PageTransition>
  );
};

export default ProductsPage;
