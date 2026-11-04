import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { productApi } from "../services/productApi";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import PageTransition from "../components/PageTransition";
import SkeletonLoader from "../components/SkeletonLoader";
import { useCart } from "../context/CartContext";
import ProductImage from "../components/ProductImage";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await productApi.getBySlug(slug);
        setProduct(data);
      } catch (error) {
        toast.error("Unable to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="section-shell grid gap-8 py-8 md:grid-cols-2">
        <SkeletonLoader className="h-[420px]" />
        <SkeletonLoader className="h-[420px]" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <PageTransition className="section-shell grid gap-8 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card-surface overflow-hidden p-4">
        <ProductImage
          product={product}
          alt={product.name}
          containerClassName="h-[520px] rounded-[28px]"
          className="h-full w-full rounded-[28px] object-cover"
        />
      </div>
      <div className="space-y-6">
        <div className="rounded-[32px] bg-white/80 p-6 shadow-soft backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
            {product.brand}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">{product.name}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.description}</p>
          <div className="mt-5 flex items-end gap-4">
            <span className="text-4xl font-extrabold text-slate-900">
              {formatCurrency(product.price)}
            </span>
            <span className="text-lg text-slate-400 line-through">
              {formatCurrency(product.mrp)}
            </span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
              {product.discount}% off
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-white px-2 py-1">
              <button type="button" className="px-3 py-2" onClick={() => setQty((value) => Math.max(1, value - 1))}>
                -
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                type="button"
                className="px-3 py-2"
                onClick={() => setQty((value) => Math.min(product.stock, value + 1))}
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={product.stock < 1}
              onClick={() => addToCart(product, qty)}
              className="gradient-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {product.stock < 1 ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-xl font-bold text-slate-900">Customer reviews</h2>
          <div className="mt-4 space-y-4">
            {product.ratings?.length ? (
              product.ratings.map((rating) => (
                <div key={rating._id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{rating.user?.name || "Customer"}</p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                      {rating.rating}/5
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{rating.review || "No written review."}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(rating.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Reviews will appear here when customers submit them.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProductDetailPage;
