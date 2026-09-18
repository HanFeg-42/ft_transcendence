import React from 'react';

interface ArenaBackgroundProps {
  children: React.ReactNode;
}

export const ArenaBackground: React.FC<ArenaBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-screen bg-[#0D0914] overflow-hidden flex flex-col">
      
      {/* 1. Starfield Limited Strictly to the Top Half (Sky) */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none overflow-hidden z-0">
        {/* Deep ambient sky glow matching design tokens */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60" 
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #510950 0%, transparent 75%)'
          }}
        />

        {/* Twinkling Pixel Stars */}
        <div className="absolute inset-0 pixel-stars-small w-full h-full" />
        <div className="absolute inset-0 pixel-stars-medium w-full h-full" />
        <div className="pixel-cross-stars" />
      </div>

      {/* 2. Neon Circuit / Maze-line Pattern (Top-Right) */}
      <div className="absolute top-0 right-0 w-[55%] h-[55%] pointer-events-none z-0 opacity-80">
        <svg
          viewBox="0 0 600 500"
          className="w-full h-full"
          preserveAspectRatio="xMaxYMin meet"
        >
          <defs>
            <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Maze lines */}
          <g fill="none" stroke="#F32077" strokeWidth="2.5" filter="url(#pinkGlow)" opacity="0.8">
            <path d="M 180,20 H 580 V 380 H 420" />
            <path d="M 240,60 H 540 V 320 H 480" />
            <path d="M 280,120 H 380 V 220 H 220 V 340 H 340" />
            <path d="M 420,120 V 260 H 500" />
            <path d="M 320,20 V 80 H 440" />
            <path d="M 480,20 V 80" />
            <path d="M 180,180 H 240 V 260" />
            <path d="M 380,300 H 440 V 420 H 540" />
            <path d="M 260,380 H 320 V 460" />
            <rect x="360" y="160" width="80" height="50" rx="3" strokeDasharray="5 3" />
          </g>

          {/* Junction Nodes & Pellets */}
          <g filter="url(#pinkGlow)">
            <circle cx="420" cy="120" r="7" fill="none" stroke="#F32077" strokeWidth="2" />
            <circle cx="280" cy="120" r="4.5" fill="#F32077" />
            <circle cx="380" cy="220" r="5" fill="#F32077" />
            <circle cx="220" cy="340" r="5" fill="#F32077" />
            <circle cx="440" cy="420" r="4.5" fill="#F32077" />
            <circle cx="540" cy="320" r="6" fill="none" stroke="#F32077" strokeWidth="2" />

            <rect x="315" y="76" width="7" height="7" fill="#8ED603" />
            <rect x="475" y="76" width="7" height="7" fill="#8ED603" />
            <rect x="496" y="256" width="7" height="7" fill="#F32077" />
            <rect x="336" y="416" width="7" height="7" fill="#8ED603" />
          </g>
        </svg>
      </div>

      {/* 3. Floating Glowing Pixel Cubes (Scattered Horizon Debris) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Pink Cubes */}
        <div
          className="absolute w-2.5 h-2.5 bg-pacova-pink shadow-neon-pink"
          style={{ top: '52%', left: '38%', animation: 'starTwinkle 2.1s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute w-2 h-2 bg-pacova-pink shadow-neon-pink"
          style={{ top: '58%', left: '54%', animation: 'starTwinkle 3.4s ease-in-out 0.5s infinite alternate' }}
        />
        <div
          className="absolute w-3 h-3 bg-pacova-pink shadow-neon-pink"
          style={{ top: '68%', left: '18%', animation: 'starTwinkle 2.7s ease-in-out 1.1s infinite alternate' }}
        />
        <div
          className="absolute w-3.5 h-3.5 bg-pacova-pink shadow-neon-pink"
          style={{ top: '76%', left: '55%', animation: 'starTwinkle 2.3s ease-in-out 0.2s infinite alternate' }}
        />
        <div
          className="absolute w-2.5 h-2.5 bg-pacova-pink shadow-neon-pink"
          style={{ top: '82%', left: '92%', animation: 'starTwinkle 3.1s ease-in-out 0.8s infinite alternate' }}
        />

        {/* Green Cubes */}
        <div
          className="absolute w-2 h-2 bg-pacova-green shadow-neon-green"
          style={{ top: '55%', left: '50%', animation: 'starTwinkle 2.9s ease-in-out 0.7s infinite alternate' }}
        />
        <div
          className="absolute w-3 h-3 bg-pacova-green shadow-neon-green"
          style={{ top: '62%', left: '47%', animation: 'starTwinkle 3.6s ease-in-out 0.3s infinite alternate' }}
        />
        <div
          className="absolute w-2 h-2 bg-pacova-green shadow-neon-green"
          style={{ top: '72%', left: '78%', animation: 'starTwinkle 2.4s ease-in-out 1.0s infinite alternate' }}
        />
        <div
          className="absolute w-2.5 h-2.5 bg-pacova-green shadow-neon-green"
          style={{ top: '80%', left: '34%', animation: 'starTwinkle 3.2s ease-in-out 0.4s infinite alternate' }}
        />
        <div
          className="absolute w-3 h-3 bg-pacova-green shadow-neon-green"
          style={{ top: '85%', left: '81%', animation: 'starTwinkle 2.8s ease-in-out 1.2s infinite alternate' }}
        />
      </div>

      {/* 4. Infinite Animated 3D Grid (Bottom Half) */}
      <div className="absolute bottom-0 left-0 right-0 h-[45vh] overflow-hidden pointer-events-none z-0">
        <div 
          className="w-[200%] h-[200%] -ml-[50%] grid-animation"
          style={{ 
            backgroundImage: `
              linear-gradient(to right, rgba(243, 32, 119, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(243, 32, 119, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: 'perspective(180px) rotateX(65deg)',
            transformOrigin: 'top center'
          }}
        />
        {/* Horizon Shadow Gradient matching surface color #0D0914 */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #0D0914 0%, transparent 30%, #0D0914 100%)'
          }}
        />
      </div>

      {/* 5. CRT Scanlines Overlay */}
      <div className="absolute inset-0 pixel-scanlines pointer-events-none z-20 opacity-30" />

      {/* Page Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};

export default ArenaBackground;