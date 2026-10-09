/**
 * Draw-in motion for the illustration: the wave draws itself once, then the highlighter sweeps in. Include this string in a
 * <style> on any page that renders HeroIllustration. Same ease-out curve as the rest of the app; none of it under reduced motion.
 */
export const heroIllustrationCss = `
@keyframes hero-draw { 0% { stroke-dashoffset: 1; opacity: 0; } 1% { opacity: 1; } 100% { stroke-dashoffset: 0; } }
@keyframes hero-sweep { from { scale: 0 1; } }
.hero-wave { stroke-dasharray: 1 2; animation: hero-draw 1200ms cubic-bezier(0.23, 1, 0.32, 1) var(--wave-delay, 200ms) backwards; }
.hero-sweep { transform-box: fill-box; transform-origin: 0 50%; animation: hero-sweep 400ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 1400ms); }
@media (prefers-reduced-motion: reduce) {
  .hero-wave, .hero-sweep { animation: none; }
}`;

/**
 * The hero illustration, drawn inline from DESIGN.md colors only: an open workbook (white pages, hairline edges, track-grey
 * text lines), an amber highlighter across two lines, indigo strand tabs on the page edge, and a soft deep blue brainwave
 * line crossing both pages. No people, no text. The shape is fixed by the viewBox, so nothing below it moves.
 * The wave draws itself once (1.2s), then the highlighter sweeps in; under reduced motion it all just shows.
 */
export function HeroIllustration() {
  const lines = [124, 148, 172, 196, 220, 244, 268, 292];
  return (
    <svg
      role="img"
      aria-label="An open workbook with a highlighted passage and colored strand tabs on its edge, and a soft blue brainwave line crossing both pages."
      viewBox="0 0 560 420"
      className="h-auto w-full"
    >
      {/* Strand tabs: behind the pages so they stick out of the right edge. */}
      <g fill="#4D35BD">
        <rect x="508" y="92" width="32" height="44" rx="8" />
        <rect x="508" y="148" width="32" height="44" rx="8" />
        <rect x="508" y="204" width="32" height="44" rx="8" />
      </g>

      {/* Page stack under the book, then the two pages. */}
      <g fill="none" stroke="#E2E0DA" strokeWidth="1.5" strokeLinecap="round">
        <path d="M60 376H500" />
        <path d="M76 384H484" />
      </g>
      <g fill="#FFFFFF" stroke="#E2E0DA" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M280 52H56Q40 52 40 68V352Q40 368 56 368H280Z" />
        <path d="M280 52H504Q520 52 520 68V352Q520 368 504 368H280Z" />
      </g>
      <path d="M280 52V368" stroke="#E2E0DA" strokeWidth="1.5" />

      {/* Text lines, as bars. Left page: a title bar and eight lines. Right page: the same, shorter. */}
      <g fill="#E1E2E7">
        {lines.map((y, i) => <rect key={`l${y}`} x="72" y={y} width={[176, 160, 176, 128, 168, 152, 176, 96][i]} height="8" rx="4" />)}
        {lines.map((y, i) => <rect key={`r${y}`} x="312" y={y} width={[168, 176, 136, 176, 120, 168, 152, 88][i]} height="8" rx="4" />)}
      </g>
      <rect x="72" y="84" width="104" height="14" rx="7" fill="#4A4F5C" />
      <rect x="312" y="84" width="88" height="14" rx="7" fill="#4A4F5C" />

      {/* Highlighter: two strokes over the left page, sweeping in left to right after the wave has drawn. */}
      <g fill="none" stroke="#FFAB2E" strokeOpacity="0.6" strokeWidth="18" strokeLinecap="round">
        <path className="hero-sweep" d="M70 152H252" style={{ ["--d" as string]: "1400ms" }} />
        <path className="hero-sweep" d="M70 176H224" style={{ ["--d" as string]: "1550ms" }} />
      </g>

      {/* The brainwave line across both pages. pathLength=1 lets the draw animation work in 0 to 1 units. */}
      <path
        className="hero-wave"
        pathLength={1}
        d="M44.0 204.6 C45.8 204.7 51.3 204.9 55.0 205.5 C58.7 206.1 62.3 207.8 66.0 208.1 C69.7 208.5 73.3 204.8 77.0 207.8 C80.7 210.8 84.3 223.5 88.0 226.0 C91.7 228.6 95.3 225.8 99.0 223.3 C102.7 220.9 106.3 213.7 110.0 211.3 C113.7 209.0 117.3 213.3 121.0 209.4 C124.7 205.5 128.3 189.5 132.0 187.9 C135.7 186.3 139.3 193.2 143.0 199.8 C146.7 206.5 150.3 223.4 154.0 227.8 C157.7 232.2 161.3 224.4 165.0 226.1 C168.7 227.8 172.3 240.5 176.0 238.1 C179.7 235.8 183.3 222.6 187.0 212.1 C190.7 201.5 194.3 177.5 198.0 174.7 C201.7 171.8 205.3 190.4 209.0 195.0 C212.7 199.7 216.3 196.5 220.0 202.5 C223.7 208.5 227.3 221.6 231.0 231.0 C234.7 240.3 238.3 261.6 242.0 258.7 C245.7 255.8 249.3 224.0 253.0 213.6 C256.7 203.2 260.3 200.7 264.0 196.2 C267.7 191.6 271.3 189.5 275.0 186.4 C278.7 183.3 282.3 170.2 286.0 177.7 C289.7 185.2 293.3 221.0 297.0 231.5 C300.7 242.1 304.3 241.9 308.0 241.0 C311.7 240.1 315.3 228.5 319.0 226.0 C322.7 223.5 326.3 232.8 330.0 225.8 C333.7 218.8 337.3 190.4 341.0 183.9 C344.7 177.3 348.3 181.7 352.0 186.6 C355.7 191.5 359.3 209.4 363.0 213.5 C366.7 217.6 370.3 207.5 374.0 211.2 C377.7 214.8 381.3 232.7 385.0 235.6 C388.7 238.5 392.3 234.2 396.0 228.6 C399.7 223.0 403.3 205.7 407.0 202.2 C410.7 198.7 414.3 208.6 418.0 207.6 C421.7 206.6 425.3 196.9 429.0 196.1 C432.7 195.3 436.3 198.1 440.0 202.9 C443.7 207.7 447.3 222.1 451.0 224.7 C454.7 227.3 458.3 219.2 462.0 218.5 C465.7 217.8 469.3 221.3 473.0 220.6 C476.7 219.9 480.3 218.0 484.0 214.4 C487.7 210.8 491.3 200.2 495.0 198.9 C498.7 197.5 504.2 205.0 506.0 206.3"
        fill="none"
        stroke="#00538A"
        strokeOpacity="0.85"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
