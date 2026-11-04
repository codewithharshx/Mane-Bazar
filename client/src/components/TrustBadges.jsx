import { motion } from "framer-motion";

const TRUST_ITEMS = [
  {
    emoji: "🚴",
    title: "Same-day delivery",
    desc: "Order before 5 PM for same-day delivery to your doorstep"
  },
  {
    emoji: "🌿",
    title: "Fresh products",
    desc: "100% fresh groceries sourced daily from local suppliers"
  },
  {
    emoji: "💰",
    title: "Honest pricing",
    desc: "Transparent prices, no hidden charges or surprise fees"
  },
  {
    emoji: "🔒",
    title: "Secure payments",
    desc: "Pay via UPI, card, net banking, or cash on delivery"
  }
];

const TrustBadges = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {TRUST_ITEMS.map((item, i) => (
      <motion.div
        key={item.title}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.08 }}
        className="flex flex-col items-center text-center rounded-2xl border border-white/60 bg-white/80 p-5 backdrop-blur-sm shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
      >
        <div className="text-3xl mb-3 select-none">{item.emoji}</div>
        <h4 className="text-sm font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
          {item.title}
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
      </motion.div>
    ))}
  </div>
);

export default TrustBadges;
