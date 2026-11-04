import React from "react";

/**
 * BrandLogo — Official Vector Branding for Mane Bazar
 * Faithfully digitized directly from the physical storefront signage at Kasegaon.
 *
 * Variants:
 *  - "header"     : Horizontal navbar lockup (MB Medallion + माने बाज़ार + MANE BAZAR)
 *  - "monogram"   : Compact serif "MB" with saffron/white/green ribbon & "Since 1984"
 *  - "storefront" : Architectural vector of the physical shop portal & fascia board
 *  - "footer"     : High-contrast version optimized for dark backgrounds
 *  - "devanagari" : Standalone 3D illuminated "माने बाज़ार" lettermark
 */
export const BrandLogo = ({
  variant = "header",
  className = "",
  size = "md",
  showSubtitle = true,
  showTagline = true,
}) => {
  if (variant === "monogram") {
    const sizeMap = {
      xs: "w-7 h-7",
      sm: "w-9 h-9",
      md: "w-11 h-11",
      lg: "w-14 h-14",
      xl: "w-20 h-20",
    };
    return (
      <div
        className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeMap[size] || "w-11 h-11"} ${className}`}
        title="Mane Bazar — Since 1984"
        aria-label="Mane Bazar Monogram"
      >
        <img
          src="/assets/branding/logo-monogram.svg"
          alt="Mane Bazar Monogram"
          className="w-full h-full object-contain drop-shadow-sm hover:scale-105 transition-transform duration-200"
        />
      </div>
    );
  }

  if (variant === "storefront") {
    return (
      <div
        className={`relative inline-block select-none overflow-hidden rounded-2xl shadow-xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white p-3 ${className}`}
        aria-label="Mane Bazar Physical Storefront in Kasegaon"
      >
        <img
          src="/assets/branding/logo-storefront.svg"
          alt="Mane Bazar Storefront — Kasegaon, Sangli"
          className="w-full h-auto object-contain max-h-[380px] mx-auto"
        />
        <div className="mt-2.5 flex items-center justify-between px-2 text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-2">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Physical Kirana Store • Kasegaon
          </span>
          <span className="font-mono text-slate-400">GSTIN: 27AILPM4993G1ZZ</span>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex items-center gap-3.5 select-none ${className}`}>
        <div className="w-12 h-12 flex-shrink-0 rounded-2xl p-0.5 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 shadow-lg">
          <img
            src="/assets/branding/logo-monogram.svg"
            alt="Mane Bazar"
            className="w-full h-full object-contain rounded-[14px]"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-500 tracking-tight drop-shadow-sm font-hindi">
              माने बाज़ार
            </span>
            <span className="text-sm font-black text-white tracking-wider">
              MANE BAZAR
            </span>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-amber-400/90 uppercase mt-0.5">
            Since 1984 • 40 Years of Trust
          </p>
        </div>
      </div>
    );
  }

  // Default: "header"
  return (
    <div className={`flex items-center gap-3 select-none flex-shrink-0 ${className}`}>
      {/* MB Emblem Medallion from store facade */}
      <div className="relative group flex-shrink-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl p-[1.5px] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md group-hover:shadow-amber-500/20 transition-all duration-200">
          <img
            src="/assets/branding/logo-monogram.svg"
            alt="Mane Bazar MB Monogram"
            className="w-full h-full object-contain rounded-[14px] bg-[#240f09]"
          />
        </div>
        {/* Subtle live pulse indicator */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
        </span>
      </div>

      {/* Brand Typography (Bilingual matching actual signage) */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          {/* Devanagari illuminated red lettermark */}
          <span className="text-[17px] sm:text-[19px] font-black leading-none text-rose-600 tracking-tight drop-shadow-[0_1px_1px_rgba(225,29,72,0.25)] font-hindi">
            माने बाज़ार
          </span>
          {/* English modern wordmark */}
          <span className="text-[13px] sm:text-[14px] font-black leading-none text-slate-900 tracking-wider">
            MANE BAZAR
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 leading-none">
              ESTD. 1984
            </span>
            {showTagline && (
              <span className="hidden md:inline-block text-[9.5px] font-medium text-slate-500 tracking-normal leading-none">
                • Kasegaon's Trusted Kirana
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
