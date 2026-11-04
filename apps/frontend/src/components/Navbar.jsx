import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useGeolocation } from "../hooks/useGeolocation";
import useDebounce from "../hooks/useDebounce";
import { BrandLogo } from "./BrandLogo";

/* ── Inline SVG Icons ─────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Navbar = () => {
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAdmin, logout } = useAuth();
  const { cartCount, subtotal, setDrawerOpen } = useCart();
  const { location: userCoords, loading: geoLoading } = useGeolocation();
  const debouncedQuery = useDebounce(query, 350);

  // Sync query from URL if user is on /products?search=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam && searchParam !== query) {
      setQuery(searchParam);
    }
  }, [location.search]);

  // Navigate on debounce
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(debouncedQuery.trim())}`, { replace: true });
  }, [debouncedQuery, navigate]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const close = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        {/* Main Navbar Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-3 sm:gap-6">
            
            {/* ── Left: Brand Logo & Location ─────────────────────────── */}
            <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
              <Link
                to="/"
                className="flex items-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl transition-transform active:scale-95"
                aria-label="Mane Bazar Home"
              >
                <BrandLogo variant="header" />
              </Link>

              {/* Vertical Divider */}
              <div className="hidden md:block h-8 w-[1px] bg-slate-200" />

              {/* Quick-Commerce Location Pill (Blinkit Style) */}
              <div className="hidden sm:flex flex-col justify-center text-left">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 leading-none">
                  <span className="text-emerald-600">⚡</span>
                  <span>15 Mins Delivery</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1 leading-none">
                  <MapPinIcon />
                  <span className="truncate max-w-[130px]">Kasegaon, Sangli</span>
                  <span className="text-slate-400">▾</span>
                </div>
              </div>
            </div>

            {/* ── Centre: Prominent Quick-Commerce Search Bar (Always Visible!) ── */}
            <div className="flex flex-1 max-w-xl mx-2 sm:mx-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Search "atta", "dal", "milk", "oil", "chips"...'
                  className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-9 sm:pr-10 rounded-2xl bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
                  >
                    <XIcon />
                  </button>
                )}
              </form>
            </div>

            {/* ── Right: Navigation Links, User & Cart ─────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Quick links on desktop */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                >
                  All Products
                </NavLink>
                <NavLink
                  to="/stores"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`
                  }
                >
                  Stores
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    Admin
                  </NavLink>
                )}
              </nav>

              {/* User Account / Login */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-all shadow-xs"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-600 to-green-500 text-white grid place-items-center text-[11px] font-black">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline max-w-[80px] truncate">{user.name?.split(" ")[0]}</span>
                    <span className="text-slate-400 text-[10px]">▾</span>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50"
                      >
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-[11px] font-semibold text-slate-400">Signed in as</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          👤 Profile Settings
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          📦 My Orders &amp; Invoices
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          ❤️ My Wishlist
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 transition-all shadow-xs hover:border-emerald-300"
                >
                  Login
                </Link>
              )}

              {/* ── Blinkit-Style Vibrant Green Cart Pill ───────────── */}
              <button
                id="cart-badge-anchor"
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex-shrink-0"
                aria-label={`Cart with ${cartCount} items`}
              >
                <CartIcon />
                <div className="flex flex-col text-left leading-none">
                  {cartCount > 0 ? (
                    <>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                        {cartCount} {cartCount === 1 ? "Item" : "Items"}
                      </span>
                      <span className="text-xs sm:text-sm font-black mt-0.5">₹{subtotal}</span>
                    </>
                  ) : (
                    <span className="font-extrabold">My Cart</span>
                  )}
                </div>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-in Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              ref={mobilePanelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <Link to="/" onClick={() => setMobileOpen(false)}>
                    <BrandLogo variant="header" showTagline={false} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <XIcon />
                  </button>
                </div>

                {/* Location indicator */}
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 mb-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    ⚡ 15-Min Fast Delivery
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">Kasegaon, Sangli • 415404</p>
                </div>

                <nav className="space-y-1">
                  <NavLink
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    🏠 Home
                  </NavLink>
                  <NavLink
                    to="/products"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    📦 All Products
                  </NavLink>
                  <NavLink
                    to="/stores"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    🏪 Kirana Stores
                  </NavLink>
                  <NavLink
                    to="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    📋 My Orders &amp; Invoices
                  </NavLink>
                  <NavLink
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    ❤️ Wishlist
                  </NavLink>
                  {isAdmin && (
                    <NavLink
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-amber-50"
                    >
                      🛠 Admin Dashboard
                    </NavLink>
                  )}
                </nav>
              </div>

              {/* Bottom user strip in mobile menu */}
              <div className="pt-4 border-t border-slate-100">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full py-3 rounded-2xl bg-emerald-600 text-white text-center text-xs font-bold shadow-md"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
