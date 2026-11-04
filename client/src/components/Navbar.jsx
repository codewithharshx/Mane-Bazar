import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useGeolocation } from "../hooks/useGeolocation";
import useDebounce from "../hooks/useDebounce";

/* ── Icons (inline SVG, no heavy dep) ─────────────────────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Navbar = () => {
  const [scrolled, setScrolled]     = useState(false);
  const [query, setQuery]           = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileRef  = useRef(null);
  const searchRef   = useRef(null);
  const mobilePanelRef = useRef(null);
  const mobileCloseRef = useRef(null);
  const previousFocusRef = useRef(null);
  const navigate    = useNavigate();

  const { user, isAdmin, logout }   = useAuth();
  const { cartCount, setDrawerOpen } = useCart();
  const { location: userCoords, loading: geoLoading } = useGeolocation();
  const debouncedQuery = useDebounce(query, 350);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* detect location */
  const isInKasegaon = useMemo(() => {
    if (!userCoords) return true;
    const dist = Math.sqrt(
      Math.pow(userCoords.lat - 17.125265, 2) +
      Math.pow(userCoords.lng - 74.187859, 2)
    ) * 111;
    return dist <= 25;
  }, [userCoords]);

  /* debounced search nav */
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(debouncedQuery.trim())}`, { replace: true });
  }, [debouncedQuery, navigate]);

  /* close profile on outside click */
  useEffect(() => {
    const close = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* lock body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    previousFocusRef.current = document.activeElement;
    const focusCloseButton = () => {
      mobileCloseRef.current?.focus();
    };

    const timer = setTimeout(focusCloseButton, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const root = mobilePanelRef.current;
      if (!root) return;

      const focusables = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocusRef.current?.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-40 px-3 py-2.5 sm:px-5 transition-all duration-300 ${scrolled ? "py-2" : ""}`}>
        <div className={`section-shell flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          scrolled
            ? "glass-panel shadow-glass bg-white/80"
            : "bg-white/75 backdrop-blur-xl border border-white/60 shadow-soft"
        }`}>

          {/* ── Left: Logo + Location ───────────────────────────────── */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-green-600 to-emerald-400 text-sm font-black text-white shadow-lg select-none">
                MB
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-black text-slate-900 leading-tight tracking-tight">Mane Bazar</p>
                <p className="text-[9px] uppercase font-bold tracking-[0.22em] text-slate-400">Premium Grocery</p>
              </div>
            </Link>

            {/* Location badge — hidden on xs */}
            <div className="hidden md:flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5">
              <span className={`flex-shrink-0 ${isInKasegaon ? "text-green-500" : "text-orange-500"}`}>
                <MapPinIcon />
              </span>
              <div className="text-xs font-semibold text-slate-600 leading-tight">
                {geoLoading ? (
                  <span className="animate-pulse text-slate-400">Locating…</span>
                ) : (
                  <>
                    <span className="text-slate-400 font-medium">Delivering to </span>
                    <span className={isInKasegaon ? "text-green-600" : "text-orange-600"}>
                      {isInKasegaon ? "Kasegaon" : "Outside Area"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Centre: Search bar (desktop) ────────────────────────── */}
          <div className="hidden xl:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands…"
                className="w-full rounded-xl border border-slate-200 bg-white/90 pl-9 pr-4 py-2.5 text-sm outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* ── Right: Nav + Actions ─────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 rounded-lg transition-colors hover:bg-slate-50 ${isActive ? "active text-green-700 bg-green-50/60" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 rounded-lg text-orange-600 hover:bg-orange-50 ${isActive ? "active bg-orange-50" : ""}`
                  }
                >
                  Admin
                </NavLink>
              )}
            </nav>

            {/* Mobile search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-expanded={searchOpen}
              aria-controls="mobile-search"
              className="xl:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            {/* User / Login */}
            {user ? (
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 grid place-items-center">
                    <span className="text-white text-[10px] font-black">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: "/profile", label: "👤 Profile" },
                        { to: "/orders", label: "📦 My Orders" },
                        { to: "/wishlist", label: "♥ Wishlist" },
                      ].map(({ to, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setProfileOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-slate-100"
                      >
                        🚪 Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon />
                <span>Login</span>
              </Link>
            )}

            {/* Cart button */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              type="button"
              id="cart-badge-anchor"
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-3.5 py-2 text-sm font-bold text-white shadow-btn-green hover:shadow-btn-green-hover hover:-translate-y-0.5 transition-all duration-200"
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1 text-[11px] font-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>

            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu-panel"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* ── Mobile search expand ──────────────────────────────────── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              id="mobile-search"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden xl:hidden"
            >
              <div className="section-shell pb-2 pt-1.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    ref={searchRef}
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products, brands…"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile slide-in menu ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="mobile-menu lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              id="mobile-menu-panel"
              ref={mobilePanelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="mobile-menu-panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-400 grid place-items-center text-white text-xs font-black">
                    MB
                  </div>
                  <span className="font-black text-slate-900">Mane Bazar</span>
                </div>
                <button
                  ref={mobileCloseRef}
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  aria-label="Close menu"
                >
                  <XIcon />
                </button>
              </div>

              {/* User info strip */}
              {user ? (
                <div className="rounded-2xl bg-green-50 border border-green-100 p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 grid place-items-center">
                      <span className="text-white text-sm font-black">{user.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-sm text-center py-3 mb-4 shadow-btn-green"
                >
                  Login / Register
                </Link>
              )}

              {/* Nav links */}
              <nav className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive ? "bg-green-50 text-green-700" : "text-slate-700 hover:bg-slate-50"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive ? "bg-orange-50 text-orange-700" : "text-orange-600 hover:bg-orange-50"
                      }`
                    }
                  >
                    🛠 Admin Panel
                  </NavLink>
                )}
              </nav>

              {/* Bottom actions */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    🚪 Logout
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => { setDrawerOpen(true); setMobileOpen(false); }}
                  className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  <CartIcon />
                  View Cart {cartCount > 0 && `(${cartCount})`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
