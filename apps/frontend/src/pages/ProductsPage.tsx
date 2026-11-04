import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productApi, categoryApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { Search, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 24 };
    if (search) params.search = search;
    if (selectedCategory) params.category = selectedCategory;
    if (sort) params.sort = sort;

    Promise.all([
      productApi.list(params),
      categoryApi.list(),
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data?.products || prodRes.data?.data || []);
      setCategories(catRes.data?.categories || catRes.data?.data || []);
    }).catch(() => {
      setProducts([]);
      setCategories([]);
    }).finally(() => setLoading(false));
  }, [search, selectedCategory, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-6">All Products</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSearchParams(e.target.value ? { category: e.target.value } : {});
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.id || cat._id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-600 font-medium">No products found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any, i: number) => (
            <motion.div
              key={product.id || product._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-slate-100 hover:border-green-200 hover:shadow-card-hover transition-all duration-300 overflow-hidden group"
            >
              <Link to={`/products/${product.slug}`}>
                <div className="aspect-square bg-slate-50 overflow-hidden">
                  <img
                    src={product.images?.[0] || product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-3">
                <p className="text-xs text-slate-400 mb-1">{product.brand}</p>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-medium text-sm text-slate-800 line-clamp-2 hover:text-green-700 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-green-700">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                  )}
                  {product.discount > 0 && (
                    <span className="text-xs text-orange-600 font-semibold">{product.discount}% off</span>
                  )}
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock < 1}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200"
                >
                  <ShoppingCart size={12} />
                  {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
