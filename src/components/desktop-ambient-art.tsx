/**
 * Decorative side-panel illustrations for wide screens. The customer journey
 * is intentionally narrow (max-w-3xl / max-w-5xl) so on desktop there's a lot
 * of empty real estate either side of the content. These panels fill that
 * space with subtle car-ownership scenes — a road heading to the horizon,
 * a stylised garage/showroom — so the page feels grounded rather than empty.
 *
 * Fixed position, lowest z-index, pointer-events:none → never interferes with
 * scrolling, clicks, or content. Hidden below `lg` so mobile layout stays
 * uncluttered.
 */

export function DesktopAmbientArt() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 hidden lg:block overflow-hidden print:hidden dark:hidden"
      aria-hidden
    >
      {/* LEFT panel — road + horizon */}
      <div className="absolute left-0 top-0 bottom-0 w-[18vw] max-w-[260px] flex items-center">
        <svg
          viewBox="0 0 220 600"
          className="w-full h-auto opacity-[0.10]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="left-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#247BA0" />
              <stop offset="100%" stopColor="#0A2463" />
            </linearGradient>
            <linearGradient id="left-road" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2D3436" />
              <stop offset="100%" stopColor="#5a6573" />
            </linearGradient>
          </defs>

          {/* Sky/background */}
          <rect x="0" y="0" width="220" height="600" fill="url(#left-sky)" />

          {/* Distant horizon hills */}
          <path
            d="M 0,330 Q 50,300 100,320 T 220,310 L 220,360 L 0,360 Z"
            fill="#0A2463"
            opacity="0.5"
          />

          {/* Road perspective wedge — narrows toward top (horizon) */}
          <path d="M 70,600 L 100,330 L 120,330 L 150,600 Z" fill="url(#left-road)" />

          {/* Road centre dashes — narrow lines along the wedge */}
          {[600, 540, 480, 420, 380, 350, 335].map((y, i) => {
            const t = (y - 330) / 270; // 0 at horizon, 1 at bottom
            const cx = 110;
            const w = 2 + t * 4;
            const h = 6 + t * 18;
            return (
              <rect
                key={i}
                x={cx - w / 2}
                y={y - h}
                width={w}
                height={h}
                fill="#FFD54F"
              />
            );
          })}

          {/* A couple of buildings on the right side */}
          <rect x="160" y="280" width="22" height="50" fill="#0A2463" opacity="0.6" />
          <rect x="186" y="260" width="18" height="70" fill="#0A2463" opacity="0.7" />
          <rect x="208" y="290" width="12" height="40" fill="#0A2463" opacity="0.5" />

          {/* A streetlamp on the left foreground */}
          <line x1="50" y1="600" x2="50" y2="430" stroke="#FFD54F" strokeWidth="2" opacity="0.6" />
          <circle cx="50" cy="425" r="4" fill="#FFD54F" opacity="0.8" />
          <line x1="50" y1="425" x2="68" y2="425" stroke="#FFD54F" strokeWidth="1.5" opacity="0.6" />
        </svg>
      </div>

      {/* RIGHT panel — showroom / garage silhouette */}
      <div className="absolute right-0 top-0 bottom-0 w-[18vw] max-w-[260px] flex items-center justify-end">
        <svg
          viewBox="0 0 220 600"
          className="w-full h-auto opacity-[0.10]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="right-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#247BA0" />
              <stop offset="100%" stopColor="#0A2463" />
            </linearGradient>
          </defs>

          {/* Sky/background */}
          <rect x="0" y="0" width="220" height="600" fill="url(#right-sky)" />

          {/* Showroom building — modern flat box */}
          <rect x="20" y="220" width="190" height="200" fill="#0A2463" />

          {/* Showroom roof line */}
          <rect x="14" y="214" width="202" height="10" fill="#FFD54F" opacity="0.9" />

          {/* Big plate-glass facade panels */}
          <rect x="35" y="240" width="50" height="160" fill="#247BA0" opacity="0.6" />
          <rect x="90" y="240" width="50" height="160" fill="#247BA0" opacity="0.6" />
          <rect x="145" y="240" width="50" height="160" fill="#247BA0" opacity="0.6" />

          {/* Window mullions */}
          <line x1="60" y1="240" x2="60" y2="400" stroke="#0A2463" strokeWidth="1.5" />
          <line x1="115" y1="240" x2="115" y2="400" stroke="#0A2463" strokeWidth="1.5" />
          <line x1="170" y1="240" x2="170" y2="400" stroke="#0A2463" strokeWidth="1.5" />
          <line x1="35" y1="320" x2="195" y2="320" stroke="#0A2463" strokeWidth="1.5" />

          {/* A car silhouette in the centre showroom panel */}
          <g transform="translate(80, 350)">
            <path
              d="M 0,18 C 2,8 14,4 22,4 L 38,4 C 46,4 50,8 54,18 L 60,18 L 60,24 L 0,24 Z"
              fill="#FF6B35"
              opacity="0.85"
            />
            <circle cx="14" cy="26" r="3.5" fill="#0A2463" />
            <circle cx="46" cy="26" r="3.5" fill="#0A2463" />
          </g>

          {/* Ground / pavement */}
          <rect x="0" y="420" width="220" height="180" fill="#2D3436" />
          <rect x="0" y="420" width="220" height="3" fill="#FFD54F" opacity="0.6" />

          {/* A sign post */}
          <line x1="200" y1="600" x2="200" y2="450" stroke="#0A2463" strokeWidth="2" opacity="0.7" />
          <rect x="180" y="430" width="40" height="22" rx="3" fill="#FF6B35" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
