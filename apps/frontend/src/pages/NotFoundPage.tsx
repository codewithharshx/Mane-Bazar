import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFoundPage = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <div className="text-8xl mb-6">🥬</div>
      <h1 className="font-display text-6xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-xl text-slate-600 mb-2">Page not found</p>
      <p className="text-slate-400 mb-8">Looks like this page wandered off the shelf!</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-green-700 transition-all hover:shadow-btn-green">
        Back to Home
      </Link>
    </motion.div>
  </div>
);
export default NotFoundPage;
