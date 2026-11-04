/**
 * Purpose-built skeleton variants for different UI shapes.
 * Usage: <ProductCardSkeleton /> <CategoryCardSkeleton /> <BannerSkeleton />
 */

/* ── Generic base skeleton ─────────────────────────────────────────── */
const Bone = ({ className = "" }) => (
  <div className={`skeleton ${className}`} />
);

/* ── Product card skeleton ─────────────────────────────────────────── */
export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl bg-white shadow-card p-4">
    <Bone className="h-52 w-full rounded-2xl" />
    <div className="mt-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <Bone className="h-3.5 w-20 rounded-full" />
        <Bone className="h-5 w-14 rounded-full" />
      </div>
      <Bone className="h-5 w-3/4 rounded-lg" />
      <Bone className="h-4 w-full rounded-lg" />
      <Bone className="h-4 w-2/3 rounded-lg" />
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1.5">
          <Bone className="h-6 w-16 rounded-lg" />
          <Bone className="h-3.5 w-12 rounded-lg" />
        </div>
        <Bone className="h-9 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

/* ── Category card skeleton ─────────────────────────────────────────── */
export const CategoryCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl bg-white shadow-card p-5">
    <Bone className="h-28 w-full rounded-2xl" />
    <div className="mt-3 space-y-2">
      <Bone className="h-4 w-3/4 rounded-lg" />
      <Bone className="h-3 w-1/2 rounded-lg" />
    </div>
  </div>
);

/* ── Store card skeleton ─────────────────────────────────────────────── */
export const StoreCardSkeleton = () => (
  <div className="overflow-hidden rounded-3xl bg-white shadow-card p-4">
    <Bone className="h-40 w-full rounded-2xl" />
    <div className="mt-4 flex items-center justify-between">
      <Bone className="h-5 w-32 rounded-lg" />
      <Bone className="h-6 w-12 rounded-full" />
    </div>
    <Bone className="mt-2 h-4 w-24 rounded-lg" />
  </div>
);

/* ── Banner skeleton ─────────────────────────────────────────────────── */
export const BannerSkeleton = () => (
  <div className="overflow-hidden rounded-4xl bg-slate-100 shadow-soft" style={{ minHeight: 440 }}>
    <div className="grid md:grid-cols-2 h-full">
      <div className="p-10 space-y-4 flex flex-col justify-center">
        <Bone className="h-6 w-40 rounded-full" />
        <Bone className="h-12 w-full rounded-xl" />
        <Bone className="h-12 w-4/5 rounded-xl" />
        <Bone className="h-5 w-full rounded-lg" />
        <Bone className="h-5 w-3/4 rounded-lg" />
        <div className="flex gap-3 pt-2">
          <Bone className="h-12 w-32 rounded-full" />
          <Bone className="h-12 w-28 rounded-full" />
        </div>
      </div>
      <Bone className="h-full min-h-64 rounded-none" />
    </div>
  </div>
);

/* ── Text row skeleton ───────────────────────────────────────────────── */
export const TextSkeleton = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Bone
        key={i}
        className="h-4 rounded-lg"
        style={{ width: i === lines - 1 ? "60%" : "100%" }}
      />
    ))}
  </div>
);

/* ── Default generic skeleton (backward compat) ──────────────────────── */
const SkeletonLoader = ({ className = "" }) => (
  <div className={`skeleton ${className}`} />
);

export default SkeletonLoader;
