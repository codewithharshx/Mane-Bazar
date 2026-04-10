const Footer = () => (
  <footer className="mt-20 border-t border-white/60 bg-white/70 py-12 backdrop-blur-sm">
    <div className="section-shell grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">Mane Bazar</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
          A fast, full-featured grocery ordering experience built for Indian households and
          neighbourhood shop owners. Shop pantry staples, dairy, snacks, personal care, and
          household essentials with smooth delivery slot booking.
        </p>
      </div>
      <div>
        <h4 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-500">
          Customer care
        </h4>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>Phone: +91 98765 43210</li>
          <li>Email: hello@manebazar.com</li>
          <li>Delivery support: 7AM - 8PM</li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-500">
          Store address
        </h4>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>12 Market Road</li>
          <li>Pune, Maharashtra 411001</li>
          <li>India</li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
