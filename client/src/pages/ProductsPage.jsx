import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import PageTransition from "../components/PageTransition";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams(
          Object.entries(filters).filter(([, value]) => value)
        ).toString();
        const [{ data: productData }, { data: categoryData }, { data: storeData }] = await Promise.all([
          api.get(`/products?${query}`),
          api.get("/categories"),
          api.get("/stores?limit=50")
        ]);
        setProducts(productData.products);
        setCategories(categoryData);
        setStores(storeData.stores || []);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  return (
    <PageTransition className="section-shell space-y-8 py-4">
      <div className="flex flex-col gap-5 rounded-[32px] bg-white/75 p-6 shadow-soft backdrop-blur-sm lg:flex-row lg:items-end">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            Browse products
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Everyday grocery essentials across pantry, dairy, snacks, and home care
          </h1>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search products or brands"
            className="input-field"
          />
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="input-field"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={filters.store}
            onChange={(event) => updateFilter("store", event.target.value)}
            className="input-field"
          >
            <option value="">All stores</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.name}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
            className="input-field"
          >
            <option value="">Newest first</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
          <input
            value={filters.brand}
            onChange={(event) => updateFilter("brand", event.target.value)}
            placeholder="Brand"
            className="input-field"
          />
          <input
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
            placeholder="Min price"
            type="number"
            className="input-field"
          />
          <input
            value={filters.maxPrice}
            onChange={(event) => updateFilter("maxPrice", event.target.value)}
            placeholder="Max price"
            type="number"
            className="input-field"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <SkeletonLoader key={index} className="h-[420px]" />
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

      {!loading && products.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">No matching products found</h2>
          <p className="mt-2 text-slate-500">Try a different category, price band, or brand.</p>
        </div>
      ) : null}

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </PageTransition>
  );
};

export default ProductsPage;
