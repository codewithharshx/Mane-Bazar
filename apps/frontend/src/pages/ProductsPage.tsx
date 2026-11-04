import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi, categoryApi } from "../services/api";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SkeletonLoader from "../components/SkeletonLoader";
import { Search } from "lucide-react";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const params: any = { limit: 36 };
    if (search) params.search = search;
    if (selectedCategory) params.category = selectedCategory;
    if (sort) params.sort = sort;

    Promise.all([
      productApi.list(params),
      categoryApi.list(),
    ])
      .then(([prodRes, catRes]) => {
        if (!isMounted) return;
        setProducts(prodRes.data?.products || prodRes.data?.data || []);
        setCategories(catRes.data?.categories || catRes.data?.data || []);
      })
      .catch(() => {
        if (isMounted) {
          setProducts([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1
          className="text-3xl font-extrabold text-slate-900"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          All Grocery Products
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore staples, dairy, beverages, snacks, and personal care essentials.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search groceries by name, brand, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSearchParams(e.target.value ? { category: e.target.value } : {});
          }}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.id || cat._id || cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700"
        >
          <option value="newest">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <SkeletonLoader count={8} />
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-5xl mb-4 select-none">🔍</div>
          <p className="text-slate-700 font-bold text-lg">No products found</p>
          <p className="text-slate-400 text-sm mt-1">
            Try searching for another staple or reset your category filter.
          </p>
          {(search || selectedCategory) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
                setSearchParams({});
              }}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-green-50 text-green-700 font-semibold text-xs hover:bg-green-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product: any, i: number) => (
            <ProductCard
              key={product.id || product._id || i}
              product={product}
              index={i}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
