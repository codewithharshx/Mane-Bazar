import { useRef } from "react";
import { Link } from "react-router-dom";

const OFFERS = [
  { emoji: "🥛", label: "Dairy", tag: "Buy 2 get 1", link: "/products?category=dairy" },
  { emoji: "🌾", label: "Grains & Rice", tag: "Bulk savings", link: "/products?category=grains" },
  { emoji: "🍫", label: "Snacks", tag: "Up to 30% off", link: "/products?category=snacks" },
  { emoji: "🧴", label: "Personal Care", tag: "Flat ₹50 off", link: "/products?category=personal-care" },
  { emoji: "☕", label: "Beverages", tag: "New arrivals", link: "/products?category=beverages" },
  { emoji: "🧹", label: "Home Care", tag: "Combos available", link: "/products?category=home-care" },
  { emoji: "🥚", label: "Eggs & Meat", tag: "Fresh daily", link: "/products?category=eggs-meat" },
];

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const OfferStrip = () => {
  const ref = useRef(null);

  const scroll = (dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft />
      </button>

      {/* Scrollable chips */}
      <div
        ref={ref}
        className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1"
      >
        {OFFERS.map((o) => (
          <Link
            key={o.label}
            to={o.link}
            className="offer-chip group"
          >
            <span className="text-base">{o.emoji}</span>
            <span>{o.label}</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
              {o.tag}
            </span>
          </Link>
        ))}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scroll(1)}
        className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight />
      </button>
    </div>
  );
};

export default OfferStrip;
