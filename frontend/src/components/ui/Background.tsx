
import React from 'react';
import Footer from './Footer';

interface BackgroundProps {
  children: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({ children }) => {
  return (
    <div
      className="pacova-app relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: '#0D0914' }}
    >
      {/* Top background: purple glow and stars */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, #510950 0%, transparent 75%)'
          }}
        />

        <div className="pixel-stars-small" />
        <div className="pixel-stars-medium" />
        <div className="pixel-cross-stars" />
      </div>

      {/* Bottom background: animated neon grid */}
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

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, #050407ff 0%, transparent 30%, #061a04ff 100%)'
          }}
        />
      </div>

      {/* Pixel scanline overlay */}
      <div className="absolute inset-0 pixel-scanlines pointer-events-none z-20 opacity-30" />

      {/* Page content */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>

      <Footer />
    </div>
  );
};

export default Background;
