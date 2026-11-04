export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="Product image unavailable">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="64" fill="url(#bg)" />
      <rect x="160" y="190" width="480" height="320" rx="36" fill="#ffffff" opacity="0.9" />
      <rect x="220" y="250" width="360" height="36" rx="18" fill="#cbd5e1" />
      <rect x="220" y="308" width="280" height="24" rx="12" fill="#e2e8f0" />
      <rect x="220" y="356" width="320" height="24" rx="12" fill="#e2e8f0" />
      <circle cx="400" cy="580" r="78" fill="#d1fae5" />
      <path d="M372 548h56l-7 104h-42z" fill="#10b981" />
      <path d="M356 556c16-28 37-42 64-42s48 14 64 42" fill="none" stroke="#10b981" stroke-width="18" stroke-linecap="round" />
    </svg>
  `);

const cleanUrl = (value) => (typeof value === "string" ? value.trim() : "");

export const getProductImage = (product) => {
  const primary = cleanUrl(product?.image);
  if (primary) return primary;

  const fromImages = Array.isArray(product?.images)
    ? product.images.map(cleanUrl).find(Boolean)
    : "";

  return fromImages || FALLBACK_PRODUCT_IMAGE;
};
