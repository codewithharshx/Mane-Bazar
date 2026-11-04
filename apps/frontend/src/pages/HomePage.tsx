import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../services/api";
import { categoryApi } from "../services/api";
import { ShoppingCart, Star, Truck, Shield, Clock, ArrowRight, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const HERO_SLIDES = [
  {
    title: "Farm-Fresh Groceries",
    subtitle: "Delivered in 30 minutes",
    description: "Get the freshest produce, dairy, and pantry essentials from local stores right to your door.",
    gradient: "from-green-600 to-emerald-700",
    emoji: "🥦",
  },
  {
    title: "Shop Smart, Save More",
    subtitle: "Exclusive deals daily",
    description: "Discover amazing deals on hundreds of products every day. Save big on your favorite brands.",
    gradient: "from-orange-500 to-amber-600",
    emoji: "🛒",
  },
  {
    title: "Local Stores, Delivered",
    subtitle: "Support your community",
    description: "Shop from the best local stores in your area and get everything delivered to your doorstep.",
    gradient: "from-blue-600 to-indigo-700",
    emoji: "🏪",
  },
];

const TRUST_ITEMS = [
  { icon: Truck, label: "Free Delivery", desc: "On orders above ₹499" },
  { icon: Shield, label: "100% Fresh", desc: "Quality guaranteed" },
  { icon: Clock, label: "30-Min Delivery", desc: "Express service" },
  { icon: Star, label: "Top Rated", desc: "4.8★ by 10,000+ users" },
];

const HomePage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([
      productApi.list({ limit: 8, sort: "featured" }).catch(() => ({ data: { products: [] } })),
      categoryApi.list().catch(() => ({ data: { categories: [] } })),
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data?.products || prodRes.data?.data || []);
      setCategories(catRes.data?.categories || catRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const current = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${current.gradient} text-white min-h-[480px] flex items-center transition-all duration-700`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-8 right-16 text-[120px]">{current.emoji}</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
          <motion.div key={slide} initial="hidden" animate="visible" variants={fadeUp}>
            <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4 backdrop-blur-sm">
              {current.subtitle}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {current.title}
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-xl">{current.description}</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link
                to="/stores"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/30 transition-all duration-200"
              >
                Find Stores
              </Link>
            </div>
          </motion.div>
        </div>
        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === slide ? "bg-white w-6" : "bg-white/40"}`}
            />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-800">Shop by Category</h2>
            <Link to="/products" className="text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((cat: any) => (
              <Link
                key={cat.id || cat._id}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-md transition-all duration-200 group"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover rounded-xl" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
                    {cat.icon || "🛒"}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 text-center group-hover:text-green-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-800">Featured Products</h2>
          <Link to="/products" className="text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🌱</div>
            <p className="font-medium">No products yet. Seed the database to get started!</p>
            <p className="text-sm mt-1">Run: <code className="bg-slate-100 px-2 py-1 rounded">npm run db:seed</code></p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <motion.div
                key={product.id || product._id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
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
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock < 1}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 hover:shadow-btn-green"
                  >
                    <ShoppingCart size={12} />
                    {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
