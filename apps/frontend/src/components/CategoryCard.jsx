import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/* Gradient palettes for categories (cycles if more categories exist) */
const PALETTES = [
  { from: "#dcfce7", to: "#bbf7d0", icon: "🥫", text: "#15803d" },
  { from: "#fef9c3", to: "#fef08a", icon: "🌾", text: "#854d0e" },
  { from: "#dbeafe", to: "#bfdbfe", icon: "🧴", text: "#1d4ed8" },
  { from: "#fce7f3", to: "#fbcfe8", icon: "🍪", text: "#9d174d" },
  { from: "#ede9fe", to: "#ddd6fe", icon: "🥛", text: "#6d28d9" },
  { from: "#ffedd5", to: "#fed7aa", icon: "🍳", text: "#9a3412" },
  { from: "#ccfbf1", to: "#99f6e4", icon: "🧂", text: "#0f766e" },
  { from: "#e0f2fe", to: "#bae6fd", icon: "🧊", text: "#0369a1" },
];

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const CategoryCard = ({ category, index = 0 }) => {
  const [imgError, setImgError] = useState(false);
  const palette = PALETTES[index % PALETTES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <Link
        to={`/products?category=${category.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover"
      >
        {/* Image / Icon area */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
            minHeight: "108px"
          }}
        >
          {category.image && !imgError ? (
            <img
              src={category.image}
              alt={category.name}
              className="h-[108px] w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-[108px] items-center justify-center text-5xl select-none">
              {palette.icon}
            </div>
          )}
          {/* Hover gradient overlay */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(to top, ${palette.from}cc, transparent)` }}
          />
        </div>

        {/* Text area */}
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <h3
              className="text-sm font-bold text-slate-900 group-hover:text-green-700 transition-colors leading-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {category.name}
            </h3>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-green-600 transition-colors">
              Shop now
            </p>
          </div>
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 group-hover:border-green-500 group-hover:bg-green-500 group-hover:text-white transition-all duration-300"
          >
            <ArrowIcon />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
