import { useEffect, useState } from "react";
import { FALLBACK_PRODUCT_IMAGE, getProductImage } from "../utils/productImage";

const ProductImage = ({
  product,
  alt,
  className = "",
  containerClassName = "",
  imageClassName = "",
  loading = "lazy"
}) => {
  const [currentSrc, setCurrentSrc] = useState(() => getProductImage(product));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(getProductImage(product));
    setLoaded(false);
  }, [product]);

  const handleError = () => {
    if (currentSrc !== FALLBACK_PRODUCT_IMAGE) {
      setCurrentSrc(FALLBACK_PRODUCT_IMAGE);
      return;
    }

    setLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-green-50 to-orange-50 ${containerClassName}`}>
      <div
        className={`absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-white to-slate-100 transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <img
        src={currentSrc}
        alt={alt || product?.name || "Product image"}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${imageClassName || "h-full w-full object-cover"} ${className} transition-transform duration-500`}
      />
    </div>
  );
};

export default ProductImage;
