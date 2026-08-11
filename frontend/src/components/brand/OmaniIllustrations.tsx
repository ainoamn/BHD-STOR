import { cn } from "@/lib/utils";

type SvgProps = {
  className?: string;
  title?: string;
};

/** Lightweight vector fort – Bahla / Nizwa style silhouette */
export function FortIllustration({ className, title = "قلعة عُمانية" }: SvgProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="8" y="48" width="144" height="56" rx="2" fill="#C4A574" />
      <rect x="8" y="48" width="144" height="10" fill="#A8894F" />
      {/* Towers */}
      <rect x="12" y="24" width="28" height="80" fill="#D2B48C" />
      <rect x="120" y="24" width="28" height="80" fill="#D2B48C" />
      <rect x="66" y="18" width="28" height="86" fill="#C9A96A" />
      {/* Crenellations */}
      {[14, 24, 34].map((x) => (
        <rect key={`l${x}`} x={x} y="16" width="8" height="10" fill="#B8956A" />
      ))}
      {[122, 132, 142].map((x) => (
        <rect key={`r${x}`} x={x} y="16" width="8" height="10" fill="#B8956A" />
      ))}
      {[68, 78, 88].map((x) => (
        <rect key={`c${x}`} x={x} y="10" width="8" height="10" fill="#A8894F" />
      ))}
      {/* Gate & windows */}
      <path d="M74 84h12v20H74V84z" fill="#3D2B1F" />
      <path d="M74 84a6 6 0 0 1 12 0" fill="#2A1D14" />
      <rect x="20" y="44" width="10" height="14" rx="5" fill="#1A3A2A" opacity="0.7" />
      <rect x="130" y="44" width="10" height="14" rx="5" fill="#1A3A2A" opacity="0.7" />
      {/* Flag */}
      <path d="M78 8h2v12h-2z" fill="#5C4033" />
      <path d="M80 8h18l-4 5 4 5H80V8z" fill="#006400" />
      <circle cx="88" cy="13" r="2.5" fill="#D4AF37" />
    </svg>
  );
}

/** Al Alam Palace – twin towers with green-gold ceremonial gate feel */
export function AlAlamPalaceIllustration({
  className,
  title = "قصر العلم",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="20" y="58" width="140" height="42" fill="#E8D5B5" />
      {/* Twin towers */}
      <rect x="18" y="28" width="32" height="72" fill="#F0E0C0" />
      <rect x="130" y="28" width="32" height="72" fill="#F0E0C0" />
      <rect x="18" y="20" width="32" height="12" fill="#006400" />
      <rect x="130" y="20" width="32" height="12" fill="#006400" />
      <rect x="22" y="12" width="24" height="10" fill="#D4AF37" />
      <rect x="134" y="12" width="24" height="10" fill="#D4AF37" />
      {/* Domes / caps */}
      <path d="M24 12c0-8 10-12 14-12s14 4 14 12" fill="#006400" />
      <path d="M136 12c0-8 10-12 14-12s14 4 14 12" fill="#006400" />
      {/* Central gate with gold */}
      <rect x="62" y="48" width="56" height="52" fill="#006400" />
      <path d="M72 100V68a18 18 0 0 1 36 0v32" fill="#D4AF37" />
      <path d="M80 100V72a10 10 0 0 1 20 0v28" fill="#0B3D1A" />
      {/* Decorative columns */}
      <rect x="58" y="48" width="6" height="52" fill="#D4AF37" />
      <rect x="116" y="48" width="6" height="52" fill="#D4AF37" />
      {/* Windows */}
      {[26, 38].map((x) => (
        <rect key={x} x={x} y="42" width="8" height="14" rx="4" fill="#1A3A2A" opacity="0.55" />
      ))}
      {[138, 150].map((x) => (
        <rect key={x} x={x} y="42" width="8" height="14" rx="4" fill="#1A3A2A" opacity="0.55" />
      ))}
    </svg>
  );
}

/** Mutrah Souq – arched corridor with lanterns */
export function MutrahSouqIllustration({
  className,
  title = "سوق مطرح",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect x="0" y="70" width="160" height="50" fill="#C4A574" opacity="0.35" />
      {/* Corridor receding arches */}
      <path d="M10 110V55c0-18 20-30 40-30h20c20 0 40 12 40 30v55" fill="#EDE0C8" />
      <path d="M28 110V60c0-12 14-20 28-20h16c14 0 28 8 28 20v50" fill="#F5EBD8" />
      <path d="M48 110V68c0-8 10-14 20-14s20 6 20 14v42" fill="#FFF8EB" />
      {/* Arch outlines */}
      <path
        d="M20 110V58c0-14 16-24 36-24h16c20 0 36 10 36 24v52"
        stroke="#A67C42"
        strokeWidth="2"
        fill="none"
      />
      {/* Lanterns */}
      <circle cx="50" cy="52" r="4" fill="#D4AF37" />
      <circle cx="80" cy="48" r="5" fill="#E8C547" />
      <circle cx="110" cy="52" r="4" fill="#D4AF37" />
      <path d="M80 42v-6" stroke="#5C4033" strokeWidth="1.5" />
      {/* Shop awnings */}
      <path d="M12 88h36l-4 8H16l-4-8z" fill="#C41E3A" />
      <path d="M112 88h36l-4 8h-28l-4-8z" fill="#006400" />
      {/* Goods hints */}
      <circle cx="28" cy="100" r="5" fill="#8B4513" />
      <circle cx="40" cy="102" r="4" fill="#D4AF37" />
      <rect x="122" y="96" width="16" height="10" rx="1" fill="#2E5A3C" />
    </svg>
  );
}

/** Coastal fort / corniche vibe – simple bastion by sea */
export function CoastalFortIllustration({
  className,
  title = "حصن بحري",
}: SvgProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M0 88c20-6 40-6 60 0s40 6 60 0 28-4 40 2v30H0V88z" fill="#5B9BD5" opacity="0.45" />
      <path d="M0 96c24-4 48-4 72 2s40 4 56-2 20-2 32 2v22H0V96z" fill="#4A90C8" opacity="0.5" />
      <rect x="40" y="36" width="80" height="52" fill="#C9B07A" />
      <rect x="36" y="28" width="20" height="60" fill="#D4BC8A" />
      <rect x="104" y="28" width="20" height="60" fill="#D4BC8A" />
      {[38, 48, 58].map((x) => (
        <rect key={x} x={x} y="22" width="6" height="8" fill="#A8894F" />
      ))}
      {[106, 116, 126].map((x) => (
        <rect key={x} x={x} y="22" width="6" height="8" fill="#A8894F" />
      ))}
      <path d="M70 88V62a10 10 0 0 1 20 0v26" fill="#3D2B1F" />
      <circle cx="130" cy="24" r="10" fill="#F4D03F" opacity="0.85" />
    </svg>
  );
}

/**
 * Decorative Omani geometric lattice — pure vector, zero network cost.
 * Used as a low-opacity hero / band pattern.
 */
export function OmaniLatticePattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none", className)}
      aria-hidden
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="oman-lattice"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M24 2 L46 24 L24 46 L2 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.35"
          />
          <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.25" />
          <path
            d="M24 12 L36 24 L24 36 L12 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            opacity="0.2"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#oman-lattice)" />
    </svg>
  );
}

/** Combined skyline for hero background – one paint, tiny DOM */
export function OmanSkyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", className)}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      {/* Soft ground */}
      <path d="M0 180h900v40H0z" fill="#C4A574" opacity="0.25" />
      {/* Far hills */}
      <path
        d="M0 160c80-40 160-50 240-30s140 40 220 20 160-50 240-30 140 40 200 20v60H0v-40z"
        fill="#006400"
        opacity="0.08"
      />
      {/* Mutrah-like arches (left) */}
      <g opacity="0.9">
        <path d="M40 190V120c0-24 28-40 56-40h28c28 0 56 16 56 40v70" fill="#E8D5B5" />
        <path d="M62 190V130c0-16 18-28 36-28s36 12 36 28v60" fill="#F5EBD8" />
        <circle cx="98" cy="118" r="5" fill="#D4AF37" />
      </g>
      {/* Fort center-left */}
      <g opacity="0.95">
        <rect x="260" y="100" width="120" height="90" fill="#C9A96A" />
        <rect x="250" y="88" width="28" height="102" fill="#D2B48C" />
        <rect x="362" y="88" width="28" height="102" fill="#D2B48C" />
        <rect x="298" y="78" width="36" height="112" fill="#B8956A" />
        {[252, 262, 272].map((x) => (
          <rect key={x} x={x} y="80" width="8" height="10" fill="#A8894F" />
        ))}
        <path d="M308 190v-36a10 10 0 0 1 20 0v36" fill="#3D2B1F" />
      </g>
      {/* Al Alam-ish twin towers (right) */}
      <g opacity="0.95">
        <rect x="560" y="115" width="150" height="75" fill="#EDE0C8" />
        <rect x="550" y="90" width="36" height="100" fill="#F0E0C0" />
        <rect x="688" y="90" width="36" height="100" fill="#F0E0C0" />
        <rect x="550" y="82" width="36" height="12" fill="#006400" />
        <rect x="688" y="82" width="36" height="12" fill="#006400" />
        <path d="M556 82c0-10 12-16 16-16s16 6 16 16" fill="#006400" />
        <path d="M694 82c0-10 12-16 16-16s16 6 16 16" fill="#006400" />
        <rect x="598" y="110" width="70" height="80" fill="#006400" />
        <path d="M612 190V140a16 16 0 0 1 32 0v50" fill="#D4AF37" />
      </g>
      {/* Coastal bastion far right */}
      <g opacity="0.85">
        <path d="M780 190c20-4 40-4 60 4v-40h-20v-28h-28v28h-16v36z" fill="#C9B07A" />
        <circle cx="860" cy="70" r="14" fill="#F4D03F" opacity="0.7" />
      </g>
      {/* Sea strip */}
      <path d="M760 178c40 4 80 4 140 0v22H760v-22z" fill="#5B9BD5" opacity="0.35" />
    </svg>
  );
}
