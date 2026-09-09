import React from 'react';

interface BackgroundProps {
  children: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-screen bg-[#0D0914] overflow-hidden flex flex-col">
      
      {/* 1. Starfield Limited strictly to the Top Half (Sky) */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none overflow-hidden z-0">
        {/* Deep ambient sky glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-60" 
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #510950 0%, transparent 75%)'
          }}
        />

        {/* Twinkling and Moving Pixel Stars */}
        <div className="pixel-stars-small" />
        <div className="pixel-stars-medium" />
        <div className="pixel-cross-stars" />
      </div>

      {/* 2. Infinite Animated 3D Grid (Bottom Half) */}
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
        {/* Horizon Shadow Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #0D0914 0%, transparent 30%, #0D0914 100%)'
          }}
        />
      </div>

      {/* 3. CRT Scanlines Overlay */}
      <div className="absolute inset-0 pixel-scanlines pointer-events-none z-20 opacity-30" />

      {/* Page Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};

export default Background;