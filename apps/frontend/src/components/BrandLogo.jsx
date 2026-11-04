import React from "react";

/**
 * BrandLogo — Official Vector Branding for Mane Bazar
 * Digitized from the physical storefront signage at Kasegaon.
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
          alt="Mane Bazar"
          className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-200"
        />
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex items-center gap-3.5 select-none ${className}`}>
        <div className="w-12 h-12 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700">
          <img
            src="/assets/branding/logo-monogram.svg"
            alt="Mane Bazar"
            className="w-full h-full object-contain rounded-[14px]"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-500 tracking-tight font-hindi">
              माने बाज़ार
            </span>
            <span className="text-sm font-black text-white tracking-wider">
              MANE BAZAR
            </span>
          </div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-amber-400 uppercase mt-0.5">
            Since 1984 • 40 Years of Kirana Trust
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
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200">
          <img
            src="/assets/branding/logo-monogram.svg"
            alt="Mane Bazar"
            className="w-full h-full object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-2">
          {/* Devanagari illuminated red lettermark */}
          <span className="text-[18px] sm:text-[20px] font-black leading-none text-rose-600 tracking-tight font-hindi">
            माने बाज़ार
          </span>
          {/* English modern wordmark */}
          <span className="text-[14px] sm:text-[15px] font-black leading-none text-slate-900 tracking-wide font-display">
            Mane Bazar
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase leading-none">
              Estd. 1984
            </span>
            {showTagline && (
              <span className="text-[10px] font-medium text-slate-400 tracking-normal leading-none">
                • Kasegaon, Sangli
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
