import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CategoryCard = ({ category, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.04, duration: 0.28 }}
  >
    <Link
      to={`/products?category=${category.slug}`}
      className="group relative block overflow-hidden rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-4 overflow-hidden rounded-2xl">
          <img
            src={category.image}
            alt={category.name}
            className="h-28 w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <h3 className="text-base font-bold text-slate-900 group-hover:text-green-700 transition-colors">{category.name}</h3>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">View All Items</p>
      </div>
    </Link>
  </motion.div>
);

export default CategoryCard;
