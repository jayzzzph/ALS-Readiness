/**
 * ALSenseLogo – reusable brand mark.
 *
 * <ALSenseLogo />              full lockup  (icon + wordmark)
 * <ALSenseLogo iconOnly />     waveform SVG only  (for tight spaces)
 * <ALSenseLogo size="sm|md|lg|xl" />
 */

const sizes = {
  sm:  { icon: 28,  text: "text-sm",  sub: "text-[10px]" },
  md:  { icon: 36,  text: "text-base",sub: "text-xs"     },
  lg:  { icon: 48,  text: "text-xl",  sub: "text-sm"     },
  xl:  { icon: 80,  text: "text-3xl", sub: "text-base"   },
};

/* The waveform SVG — faithfully reproduces the ALSense mark:
   gentle sine wave → sharp EKG spike → diagonal arrow with arrowhead
   Two teal node dots, one amber node dot, amber filled arrowhead. */
function WaveIcon({ size = 36, className = "" }) {
  const s = size;
  // We draw in a 100×70 viewBox and scale with width/height
  return (
    <svg
      viewBox="0 0 110 72"
      width={s}
      height={Math.round(s * 0.655)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ── Waveform path ── */}
      <path
        d="M4 42
           C10 42 13 30 18 30
           C23 30 26 52 31 52
           C36 52 38 18 44 18
           C48 18 50 38 53 38
           L57 14
           L61 58
           L66 36
           L72 42
           L86 20
           L100 6"
        stroke="#3535C5"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ── Teal node dot 1 (on first curve) ── */}
      <circle cx="23" cy="38" r="4.5" fill="#4DB88A" />
      {/* ── Teal node dot 2 (on peak) ── */}
      <circle cx="44" cy="18" r="4.5" fill="#4DB88A" />
      {/* ── Amber node dot (mid section) ── */}
      <circle cx="66" cy="36" r="4.5" fill="#F5A623" />
      {/* ── Amber arrowhead ── */}
      <polygon
        points="100,6  88,4  94,16"
        fill="#F5A623"
      />
    </svg>
  );
}

export function ALSenseLogo({
  iconOnly = false,
  size = "md",
  light = false,       // true = white text (for dark backgrounds)
  showSub = true,
  subText = "Empowering Adult Learners",
  className = "",
}) {
  const s = sizes[size] || sizes.md;

  if (iconOnly) {
    return <WaveIcon size={s.icon} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <WaveIcon size={s.icon} />
      <div className="leading-none">
        <div
          className={`font-extrabold tracking-tight leading-none ${s.text} ${light ? "text-white" : "text-[#3535C5]"}`}
          style={{ fontFamily: "system-ui, sans-serif" }}
        >
          ALSense
        </div>
        {showSub && (
          <div className={`mt-0.5 ${s.sub} ${light ? "text-blue-200" : "text-gray-400"} leading-none`}>
            {subText}
          </div>
        )}
      </div>
    </div>
  );
}
