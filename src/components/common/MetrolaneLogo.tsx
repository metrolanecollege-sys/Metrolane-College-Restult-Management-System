import React from 'react';

interface MetrolaneLogoProps {
  className?: string;
  size?: number;
  showMotto?: boolean;
  watermark?: boolean;
}

export const MetrolaneLogo: React.FC<MetrolaneLogoProps> = ({
  className = '',
  size = 64,
  showMotto = false,
  watermark = false,
}) => {
  const opacityClass = watermark ? 'opacity-15' : 'opacity-100';

  return (
    <div className={`inline-flex flex-col items-center justify-center ${opacityClass} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="metroOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8601C" />
            <stop offset="100%" stopColor="#F9A825" />
          </linearGradient>
          <linearGradient id="metroSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Rosette / Scalloped Edge (Silver / Dark Slate) */}
        <path
          d="M 120 4 
             L 132 14 L 148 10 L 157 24 L 174 24 L 180 40 L 197 44 L 199 61 L 214 70 L 212 87 L 224 100 L 218 117 L 226 132 L 216 147 L 220 164 L 206 176 L 205 193 L 189 201 L 184 217 L 167 220 L 158 234 L 142 232 L 129 243 L 115 237 L 100 244 L 91 234 L 75 236 L 70 221 L 53 218 L 52 201 L 36 193 L 39 176 L 25 165 L 33 148 L 22 133 L 33 118 L 25 102 L 39 88 L 36 71 L 52 64 L 53 46 L 70 43 L 75 28 L 92 30 L 102 19 L 117 25 Z"
          fill="#475569"
          stroke="url(#metroSilver)"
          strokeWidth="3"
        />

        {/* Outer Silver Ring */}
        <circle cx="120" cy="120" r="102" fill="#334155" stroke="url(#metroSilver)" strokeWidth="4" />

        {/* Orange Accent Ring with laurel dashes */}
        <circle cx="120" cy="120" r="92" fill="#E8601C" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="120" cy="120" r="88" fill="none" stroke="url(#metroSilver)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Text Arc: METROLANE (top) */}
        <path id="textArcTop" d="M 46 120 A 74 74 0 0 1 194 120" fill="none" />
        <text fill="#FFFFFF" fontSize="13.5" fontWeight="900" letterSpacing="3.5" textAnchor="middle">
          <textPath href="#textArcTop" startOffset="50%">
            METROLANE
          </textPath>
        </text>

        {/* Text Arc: COLLEGE OF HEALTH, SCIENCE & TECH (bottom) */}
        <path id="textArcBottom" d="M 194 120 A 74 74 0 0 1 46 120" fill="none" />
        <text fill="#FFFFFF" fontSize="7.5" fontWeight="700" letterSpacing="1.2" textAnchor="middle">
          <textPath href="#textArcBottom" startOffset="50%">
            COLLEGE OF HEALTH, SCIENCE &amp; TECH
          </textPath>
        </text>

        {/* Central Shield Outer Border */}
        <circle cx="120" cy="120" r="62" fill="#FFFFFF" stroke="url(#metroSilver)" strokeWidth="4" />
        
        {/* Shield Quadrants */}
        <g clipPath="url(#shieldClip)">
          <clipPath id="shieldClip">
            <circle cx="120" cy="120" r="59" />
          </clipPath>
          
          {/* Top Left: Dark Grey */}
          <rect x="60" y="60" width="60" height="60" fill="#334155" />
          {/* Top Right: White */}
          <rect x="120" y="60" width="60" height="60" fill="#FFFFFF" />
          {/* Bottom Left: White */}
          <rect x="60" y="120" width="60" height="60" fill="#FFFFFF" />
          {/* Bottom Right: Dark Grey */}
          <rect x="120" y="120" width="60" height="60" fill="#334155" />

          {/* Dividing Cross */}
          <line x1="120" y1="60" x2="120" y2="180" stroke="#CBD5E1" strokeWidth="2.5" />
          <line x1="60" y1="120" x2="180" y2="120" stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Quadrant 1 (Top-Left): Graduation Cap (White) */}
          <g transform="translate(74, 76)">
            {/* Mortarboard Diamond */}
            <polygon points="17,6 31,13 17,20 3,13" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
            {/* Cap Base */}
            <path d="M 9 16.5 L 9 24 C 9 28 25 28 25 24 L 25 16.5" fill="#FFFFFF" />
            {/* Tassel */}
            <path d="M 17 13 L 28 17 L 27 26" stroke="#F9A825" strokeWidth="1.2" fill="none" />
            <circle cx="27" cy="27" r="1.5" fill="#F9A825" />
          </g>

          {/* Quadrant 2 (Top-Right): Stethoscope + Heart/Plus (Orange) */}
          <g transform="translate(132, 74)">
            {/* Heart */}
            <path
              d="M 17 11 C 17 6 12 5 9 8 C 6 5 1 6 1 11 C 1 17 9 22 9 22 C 9 22 17 17 17 11 Z"
              fill="#E8601C"
            />
            {/* White Medical Cross in Heart */}
            <rect x="7.8" y="9.5" width="2.4" height="6" fill="#FFFFFF" rx="0.5" />
            <rect x="6" y="11.3" width="6" height="2.4" fill="#FFFFFF" rx="0.5" />
            {/* Stethoscope Tubing */}
            <path
              d="M 19 8 C 24 8 26 14 26 22 C 26 28 21 31 16 31 C 11 31 6 29 4 25"
              fill="none"
              stroke="#E8601C"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Chest Piece */}
            <circle cx="4" cy="25" r="3" fill="#E8601C" stroke="#FFFFFF" strokeWidth="1" />
          </g>

          {/* Quadrant 3 (Bottom-Left): Science Conical Flask (Orange) */}
          <g transform="translate(73, 131)">
            {/* Flask neck and body */}
            <path
              d="M 13 3 L 19 3 L 19 10 L 29 27 C 30 29 28 31 25 31 L 7 31 C 4 31 2 29 3 27 L 13 10 Z"
              fill="#E8601C"
              stroke="#E8601C"
              strokeWidth="1.2"
            />
            {/* Liquid & Molecules */}
            <path d="M 6 25 L 26 25 L 28 29 C 28 30 27 30.5 25 30.5 L 7 30.5 C 5 30.5 4 30 4 29 Z" fill="#F9A825" />
            <circle cx="16" cy="22" r="2.2" fill="#FFFFFF" />
            <circle cx="12" cy="18" r="1.5" fill="#FFFFFF" />
            <circle cx="20" cy="17" r="1.2" fill="#FFFFFF" />
            {/* Neck Rim */}
            <rect x="11.5" y="1.5" width="9" height="2" fill="#E8601C" rx="1" />
          </g>

          {/* Quadrant 4 (Bottom-Right): Gear & Laptop (Orange on Dark) */}
          <g transform="translate(133, 133)">
            {/* Gear Cog */}
            <circle cx="16" cy="15" r="11" fill="none" stroke="#E8601C" strokeWidth="3" strokeDasharray="4 2.5" />
            <circle cx="16" cy="15" r="6" fill="#334155" stroke="#E8601C" strokeWidth="1.5" />
            {/* Laptop Base & Screen */}
            <rect x="7" y="17" width="18" height="11" rx="1" fill="#FFFFFF" stroke="#E8601C" strokeWidth="1" />
            <rect x="9" y="19" width="14" height="7" fill="#E8601C" />
            <path d="M 4 28 L 28 28 L 26 31 L 6 31 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
          </g>
        </g>

        {/* Center Pivot Silver Dot */}
        <circle cx="120" cy="120" r="4" fill="url(#metroSilver)" stroke="#FFFFFF" strokeWidth="1" />
      </svg>

      {/* Ribbon Banner & Motto */}
      {showMotto && (
        <div className="mt-2 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-center gap-2">
            <div className="h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-transparent flex-1" />
            <span className="text-[10px] md:text-[11px] font-semibold tracking-wider text-[#475569] uppercase px-1">
              Compassion in Health, Precision in Science, Innovation in Technology
            </span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-transparent flex-1" />
          </div>
          <div className="flex gap-1.5 text-[#F47B20] text-xs mt-0.5">
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
        </div>
      )}
    </div>
  );
};
