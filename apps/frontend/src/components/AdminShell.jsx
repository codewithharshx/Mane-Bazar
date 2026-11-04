import { NavLink, Link } from "react-router-dom";
import PageTransition from "./PageTransition";
import { BrandLogo } from "./BrandLogo";

const adminLinks = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stores", to: "/admin/stores" },
  { label: "Products", to: "/admin/products" },
  { label: "Orders", to: "/admin/orders" },
  { label: "Users", to: "/admin/users" },
  { label: "Inventory", to: "/admin/inventory" }
];

const AdminShell = ({ title, subtitle, children }) => (
  <PageTransition className="section-shell grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
    <aside className="card-surface h-fit p-4">
      <div className="mb-4 pb-3 border-b border-slate-100">
        <Link to="/" className="block focus:outline-none">
          <BrandLogo variant="header" showTagline={false} />
        </Link>
      </div>
      <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700 bg-amber-50 rounded-lg inline-block mb-2">
        Admin Portal
      </p>
      <nav className="mt-2 space-y-2">
        {adminLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/admin"}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">
          Store operations
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-2 text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  </PageTransition>
);

export default AdminShell;
