/**
 * Hand-lettered wildstyle wordmark for the hero.
 * Layered SVG: purple back-shadow piece, black outline, green fill with chrome
 * highlight, arrow-tail flourishes. Slanted for real tag character.
 */
export function GraffitiWordmark({ id = 'greenlist-piece' }: { id?: string }) {
  const fillId = `${id}-fill`;
  const chromeId = `${id}-chrome`;
  const glowId = `${id}-glow`;

  return (
    <div className="greenlist-piece" aria-label="The Green List">
      <span className="greenlist-piece__the" aria-hidden>The</span>
      <svg
        className="greenlist-piece__svg"
        viewBox="0 0 1200 340"
        role="img"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Green fill: bright top, deeper mid, dark base — like wet paint */}
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6ff8a" />
            <stop offset="18%" stopColor="#c6ff3d" />
            <stop offset="55%" stopColor="#7ed321" />
            <stop offset="100%" stopColor="#3e7d0f" />
          </linearGradient>
          {/* Chrome highlight sweep across the top edge */}
          <linearGradient id={chromeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* SKEW GROUP — everything gets the wildstyle slant */}
        <g transform="translate(20 20) skewX(-14)">
          {/* Arrow tail flourish on the left */}
          <path
            d="M -10 210 L 40 150 L 70 165 L 30 210 L 65 240 L 30 250 Z"
            fill="#8a2be2"
            stroke="#000"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* PURPLE BACK PIECE (offset shadow) — GREEN */}
          <text
            x="26"
            y="222"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="220"
            fontWeight="900"
            fill="#8a2be2"
            stroke="#000"
            strokeWidth="10"
            paintOrder="stroke fill"
            strokeLinejoin="round"
            letterSpacing="-2"
          >
            GREEN
          </text>

          {/* BLACK OUTLINE + GREEN FILL — GREEN */}
          <text
            x="10"
            y="206"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="220"
            fontWeight="900"
            fill={`url(#${fillId})`}
            stroke="#000"
            strokeWidth="14"
            paintOrder="stroke fill"
            strokeLinejoin="round"
            strokeLinecap="round"
            letterSpacing="-2"
          >
            GREEN
          </text>
          {/* Chrome highlight sweep clipped to GREEN */}
          <text
            x="10"
            y="206"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="220"
            fontWeight="900"
            fill={`url(#${chromeId})`}
            letterSpacing="-2"
            style={{ mixBlendMode: 'screen' }}
          >
            GREEN
          </text>

          {/* PURPLE BACK PIECE — LIST (offset down/right) */}
          <text
            x="716"
            y="252"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="200"
            fontWeight="900"
            fill="#8a2be2"
            stroke="#000"
            strokeWidth="10"
            paintOrder="stroke fill"
            strokeLinejoin="round"
            letterSpacing="-2"
          >
            LIST
          </text>

          {/* BLACK OUTLINE + WHITE-CHROME FILL — LIST */}
          <text
            x="700"
            y="236"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="200"
            fontWeight="900"
            fill="#f5f5f0"
            stroke="#000"
            strokeWidth="14"
            paintOrder="stroke fill"
            strokeLinejoin="round"
            letterSpacing="-2"
          >
            LIST
          </text>
          <text
            x="700"
            y="236"
            fontFamily="var(--font-mural), Impact, Arial Black, sans-serif"
            fontSize="200"
            fontWeight="900"
            fill={`url(#${chromeId})`}
            letterSpacing="-2"
            style={{ mixBlendMode: 'screen' }}
          >
            LIST
          </text>

          {/* Arrow flourish on the right */}
          <path
            d="M 1130 90 L 1180 60 L 1200 100 L 1160 130 L 1195 165 L 1155 175 L 1120 140 Z"
            fill="#8a2be2"
            stroke="#000"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Drip on the E of GREEN */}
          <path
            d="M 220 210 Q 226 260 232 275 Q 238 285 244 275 Q 250 260 244 210 Z"
            fill="#7ed321"
            stroke="#000"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Drip on the T of LIST */}
          <path
            d="M 990 240 Q 996 285 1002 298 Q 1008 306 1014 298 Q 1020 285 1014 240 Z"
            fill="#f5f5f0"
            stroke="#000"
            strokeWidth="6"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
