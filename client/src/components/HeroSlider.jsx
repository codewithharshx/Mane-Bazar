import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    tag: "🔥 Up to 30% off today",
    title: "Fresh pantry staples, delivered same day",
    text: "Rice, dal, dairy, snacks, beverages, household care from your neighbourhood grocery store.",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1400&q=80",
    cta: "Shop now",
    ctaLink: "/products",
    alt: "Browse deals",
    altLink: "/products?sort=price_asc",
    accentColor: "from-green-900 via-green-800 to-emerald-900"
  },
  {
    id: 2,
    tag: "💰 Weekly savings unlocked",
    title: "Big savings on family essentials every week",
    text: "Unlock price drops on trusted Indian brands, daily kitchen basics, and packaged foods.",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80",
    cta: "View offers",
    ctaLink: "/products?sort=popular",
    alt: "Best deals",
    altLink: "/products?sort=price_desc",
    accentColor: "from-amber-900 via-orange-800 to-amber-900"
  },
  {
    id: 3,
    tag: "🚴 Same-day delivery slots",
    title: "Fast delivery that fits your daily routine",
    text: "Choose morning, afternoon, or evening delivery with live order status and PDF invoices.",
    image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=1400&q=80",
    cta: "Book a slot",
    ctaLink: "/products",
    alt: "Track orders",
    altLink: "/orders",
    accentColor: "from-blue-900 via-indigo-800 to-blue-900"
  }
];

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const HeroSlider = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % slides.length), []);
  const prev = useCallback(() => setActive((i) => (i - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[active];

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-glass"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative grid min-h-[460px] sm:min-h-[520px] overflow-hidden rounded-3xl bg-gradient-to-br ${slide.accentColor} md:grid-cols-[1.15fr_0.85fr]`}
        >
          {/* ── Text panel ────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col justify-center p-7 sm:p-12 text-white">
            {/* Offer tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm"
            >
              {slide.tag}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="max-w-lg text-3xl font-extrabold leading-tight sm:text-5xl"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base"
            >
              {slide.text}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <Link
                to={slide.ctaLink}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                {slide.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to={slide.altLink}
                className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                {slide.alt}
              </Link>
            </motion.div>

            {/* Slide counter */}
            <div className="mt-10 text-xs font-bold tracking-widest text-white/40 uppercase">
              {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </div>
          </div>

          {/* ── Image panel ───────────────────────────────────────── */}
          <div className="relative hidden md:block">
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover"
              style={{ opacity: 0.65 }}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-slate-950/70" />
          </div>

          {/* Mobile bg image */}
          <div
            className="absolute inset-0 -z-0 md:hidden"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.18
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation arrows ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white/15 border border-white/20 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-white/15 border border-white/20 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight />
      </button>

      {/* ── Dot indicators ────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/10">
          <motion.div
            key={`progress-${active}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5.5, ease: "linear" }}
            className="h-full bg-white/50"
          />
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
