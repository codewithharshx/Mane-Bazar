import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { productApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import ProductImage from "../components/ProductImage";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productApi.getBySlug(slug)
      .then((res) => setProduct(res.data?.product || res.data))
      .catch(() => navigate("/products"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 animate-pulse">
      <div className="aspect-square bg-slate-100 rounded-3xl" />
      <div className="space-y-4">
        <div className="h-6 bg-slate-100 rounded w-1/3" />
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  );

  if (!product) return null;

  const wishlisted = isWishlisted(product.id || product._id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-green-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="grid md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="aspect-square rounded-3xl overflow-hidden bg-slate-50">
          <ProductImage
            product={product}
            alt={product.name}
            containerClassName="w-full h-full rounded-3xl"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
          <p className="text-green-600 font-medium text-sm mb-2">{product.brand}</p>
          <h1 className="font-display text-3xl font-bold text-slate-800 mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-green-700">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-lg text-slate-400 line-through">₹{product.mrp}</span>
            )}
            {product.discount > 0 && (
              <span className="bg-orange-100 text-orange-600 text-sm font-bold px-2 py-0.5 rounded-lg">{product.discount}% OFF</span>
            )}
          </div>
          <p className="text-slate-600 mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-green-50 transition-colors">-</button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold hover:bg-green-50 transition-colors">+</button>
            </div>
            <span className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => addToCart({ ...product, _id: product.id || product._id }, qty)}
              disabled={product.stock < 1}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold py-3 rounded-2xl transition-all hover:shadow-btn-green"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              onClick={() => toggleWishlist({ ...product, _id: product.id || product._id })}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${wishlisted ? "border-red-400 bg-red-50 text-red-500" : "border-slate-200 hover:border-red-300 text-slate-400"}`}
            >
              <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
