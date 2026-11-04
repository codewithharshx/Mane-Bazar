import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Stores", to: "/stores" },
  { label: "My Orders", to: "/orders" },
  { label: "Profile", to: "/profile" },
];

const HELP_LINKS = [
  { label: "Track Order", to: "/orders" },
  { label: "Contact Support", to: "#" },
  { label: "Return Policy", to: "#" },
  { label: "FAQ", to: "#" },
];

const PAYMENT_BADGES = [
  { label: "Razorpay", emoji: "💳" },
  { label: "UPI", emoji: "📱" },
  { label: "COD", emoji: "💵" },
  { label: "Net Banking", emoji: "🏦" },
];

const SOCIAL = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    label: "WhatsApp",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    )
  }
];

const Footer = () => (
  <footer className="mt-20 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
    {/* Main footer grid */}
    <div className="section-shell py-12">
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1.2fr]">

        {/* Brand column */}
        <div>
          <Link to="/" className="inline-block focus:outline-none rounded-2xl">
            <BrandLogo variant="header" showTagline={true} />
          </Link>

          <p className="mt-4 text-sm leading-7 text-slate-500 max-w-xs">
            Serving Kasegaon families with pride since 1984. From daily kitchen staples, pure oils &amp; spices to packaged essentials — now delivered directly to your doorstep with guaranteed Kirana purity.
          </p>

          <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-1.5 text-xs font-semibold text-amber-800">
            <span>📍</span>
            <span>Store: Kasegaon, Sangli • GSTIN: 27AILPM4993G1ZZ</span>
          </div>

          {/* Social icons */}
          <div className="mt-5 flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            Help & Support
          </h4>
          <ul className="space-y-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Customer Care</p>
            <p className="text-sm text-slate-600">📞 +91 98765 43210</p>
            <p className="text-sm text-slate-600">✉️ hello@manebazar.com</p>
            <p className="text-xs text-slate-400">Available: 7AM – 8PM, all days</p>
          </div>
        </div>

        {/* Store info + app teaser */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            Our Store
          </h4>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-800">📍 Kasegaon, Maharashtra</p>
            <p className="text-sm text-slate-500">12 Market Road, Kasegaon</p>
            <p className="text-sm text-slate-500">Maharashtra, India 415404</p>
          </div>

          {/* Delivery info */}
          <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/60 p-4">
            <p className="text-sm font-bold text-green-800">🚴 Same-day delivery</p>
            <p className="mt-1 text-xs text-green-700">Free delivery on orders above ₹499</p>
            <p className="text-xs text-green-600 mt-1">COD available</p>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-slate-200/60 bg-slate-50/80">
      <div className="section-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Mane Bazar. All rights reserved. Built with ❤️ in India.
        </p>

        {/* Payment badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Payments:
          </span>
          {PAYMENT_BADGES.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              <span>{b.emoji}</span>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
