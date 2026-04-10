import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

const slides = [
  {
    title: "Fresh pantry staples, delivered the same day",
    text: "Rice, dal, dairy, snacks, beverages, household care, and more from your neighbourhood grocery store.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    cta: "Shop now"
  },
  {
    title: "Big weekly savings on family essentials",
    text: "Unlock price drops on trusted Indian brands, daily kitchen basics, and popular packaged foods.",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80",
    cta: "View offers"
  },
  {
    title: "Fast delivery slots that fit your routine",
    text: "Choose morning, afternoon, or evening delivery with live order status and downloadable invoices.",
    image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=1200&q=80",
    cta: "Book a slot"
  }
];

const HeroSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[36px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[activeIndex].title}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45 }}
          className="relative grid min-h-[520px] overflow-hidden rounded-[36px] bg-slate-900 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="relative z-10 flex flex-col justify-center p-8 text-white sm:p-12">
            <div className="mb-5 inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Mane Bazar Grocery Shop
            </div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight sm:text-5xl">
              {slides[activeIndex].title}
            </h1>
            <p className="mt-5 max-w-xl text-base text-emerald-50/85 sm:text-lg">
              {slides[activeIndex].text}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="accent-button">
                {slides[activeIndex].cta}
              </Link>
              <Link
                to="/products?sort=price_desc"
                className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white"
              >
                Best deals
              </Link>
            </div>
          </div>
          <div className="relative">
            <img
              src={slides[activeIndex].image}
              alt={slides[activeIndex].title}
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-950/60" />
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-6 left-8 z-20 flex gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition ${index === activeIndex ? "w-10 bg-white" : "w-2.5 bg-white/45"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
