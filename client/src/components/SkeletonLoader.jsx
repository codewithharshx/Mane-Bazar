const SkeletonLoader = ({ className = "" }) => (
  <div className={`relative overflow-hidden rounded-[2rem] bg-slate-100/50 backdrop-blur-sm ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
    <style>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}
    </style>
  </div>
);

export default SkeletonLoader;
