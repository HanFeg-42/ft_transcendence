import React from 'react';

export type PixelIconName = 
  | 'pacman' 
  | 'ghost-red' 
  | 'ghost-pink' 
  | 'ghost-cyan' 
  | 'diamond' 
  | 'heart' 
  | 'strawberry';

interface PixelIconProps {
  name: PixelIconName;
  size?: number; // Taille en pixels (par défaut 32px)
  className?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ 
  name, 
  size = 32, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // shapeRendering guarantees pixel-sharp edges without blur
      style={{ shapeRendering: 'crispEdges' }} 
      className={`inline-block ${className}`}
    >
      {/* 1. PACMAN */}
      {name === 'pacman' && (
        <path
          d="M5 2h6v1h2v1h1v2h1v4h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V6h1V4h1V3h2V2zm4 2H8v2h2V4zM8 8l5-3v6L8 8z"
          fill="#FFD700"
        />
      )}

      {/* 2. FANTÔME ROUGE (BLINKY) */}
      {name === 'ghost-red' && (
        <g>
          <path d="M4 2h8v1h2v2h1v8h-1v1h-2v-1h-1v1H9v-1H7v1H5v-1H4v1H2v-1H1V5h1V3h2V2z" fill="#FF0000" />
          {/* Yeux */}
          <path d="M3 5h3v3H3V5zm6 0h3v3H9V5z" fill="#FFFFFF" />
          <path d="M3 6h2v2H3V6zm6 0h2v2H9V6z" fill="#0000FF" />
        </g>
      )}

      {/* 3. FANTÔME ROSE (PINKY) */}
      {name === 'ghost-pink' && (
        <g>
          <path d="M4 2h8v1h2v2h1v8h-1v1h-2v-1h-1v1H9v-1H7v1H5v-1H4v1H2v-1H1V5h1V3h2V2z" fill="#FFB8FF" />
          <path d="M3 5h3v3H3V5zm6 0h3v3H9V5z" fill="#FFFFFF" />
          <path d="M3 6h2v2H3V6zm6 0h2v2H9V6z" fill="#0000FF" />
        </g>
      )}

      {/* 4. FANTÔME CYAN (INKY) */}
      {name === 'ghost-cyan' && (
        <g>
          <path d="M4 2h8v1h2v2h1v8h-1v1h-2v-1h-1v1H9v-1H7v1H5v-1H4v1H2v-1H1V5h1V3h2V2z" fill="#00FFFF" />
          <path d="M3 5h3v3H3V5zm6 0h3v3H9V5z" fill="#FFFFFF" />
          <path d="M3 6h2v2H3V6zm6 0h2v2H9V6z" fill="#0000FF" />
        </g>
      )}

      {/* 5. DIAMANT / JOYAU NÉON */}
      {name === 'diamond' && (
        <g>
          <path d="M5 2h6v2h3v2l-6 8-6-8V4h3V2z" fill="#00E5FF" />
          <path d="M6 3h4v2H6V3zm-2 3h8v1H4V6zm2 2h4v2H6V8z" fill="#FFFFFF" opacity="0.6" />
        </g>
      )}

      {/* 6. CŒUR RETRO */}
      {name === 'heart' && (
        <path
          d="M2 3h3v2H2V3zm9 0h3v2h-3V3zm-7 2h3v2H4V5zm5 0h3v2H9V5zm-6 2h10v2H3V7zm1 2h8v2H4V9zm2 2h4v2H6v-2zm2 2h1v1H8v-1z"
          fill="#F32077"
        />
      )}

      {/* 7. FRAISE BONUS */}
      {name === 'strawberry' && (
        <g>
          <path d="M6 2h4v2H6V2zm-2 2h8v2H4V4z" fill="#8ED603" />
          <path d="M3 6h10v4h-2v2H9v2H7v-2H5v-2H3V6z" fill="#FF0055" />
          <path d="M5 7h1v1H5V7zm5 0h1v1h-1V7zm-3 3h1v1H7v-1z" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
};

export default PixelIcon;