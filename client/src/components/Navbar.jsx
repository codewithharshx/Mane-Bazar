import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { NAV_LINKS } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useGeolocation } from "../hooks/useGeolocation";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { cartCount, setDrawerOpen } = useCart();
  const { location: userCoords, loading: geoLoading } = useGeolocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isInKasegaon = useMemo(() => {
    // Mane Bazar coords: 17.125265, 74.187859
    if (!userCoords) return true; // Default to true for UI
    const dist =
      Math.sqrt(
        Math.pow(userCoords.lat - 17.125265, 2) +
          Math.pow(userCoords.lng - 74.187859, 2)
      ) * 111; // Approx km
    return dist <= 25;
  }, [userCoords]);

  return (
    <header className="sticky top-0 z-40 px-3 py-3 sm:px-5">
      <div
        className={`section-shell flex items-center justify-between rounded-full px-4 py-3 transition sm:px-6 ${
          scrolled ? "glass-panel shadow-glass" : "bg-white/70 backdrop-blur-xl"
        }`}
      >
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-green-600 to-emerald-400 text-lg font-extrabold text-white shadow-lg">
              MB
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 leading-tight">Mane Bazar</p>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
                Premium Grocery
              </p>
            </div>
          </Link>

          <div className="hidden h-10 w-[1px] bg-slate-200 md:block"></div>

          <div className="hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 md:flex border border-slate-100">
            <div
              className={`h-2 w-2 rounded-full ${isInKasegaon ? "bg-green-500" : "bg-orange-500"} animate-pulse`}
            ></div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {geoLoading
                ? "Locating..."
                : isInKasegaon
                  ? "Delivering now in "
                  : "Outside area: "}
              <span className="text-green-600">
                {isInKasegaon ? "Kasegaon" : "Mane Bazar Only"}
              </span>
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold ${isActive ? "text-green-700" : "text-slate-700"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin" className="text-sm font-semibold text-orange-600">
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 sm:block"
              >
                Hi, {user.name.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 md:block"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 sm:block"
            >
              Login
            </Link>
          )}
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            id="cart-badge-anchor"
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-3 font-semibold text-white"
          >
            Cart
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{cartCount}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
