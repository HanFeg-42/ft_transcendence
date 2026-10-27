import React, { useEffect, useState } from 'react';
import Footer from './Footer';

interface BackgroundProps {
  children: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('pacova-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pacova-theme', theme);
    } catch {
      // Theme still works for this session if storage is unavailable.
    }
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <div
      data-theme={theme}
      className={`pacova-app relative min-h-screen w-full overflow-hidden flex flex-col ${isLight ? 'pacova-light' : 'pacova-dark'}`}
      style={{ background: isLight
        ? 'linear-gradient(180deg, #9c4268ff 0%, #f7e6f0 48%, #f7f3fb 100%)'
        : '#0D0914' }}
    >
      <button
        type="button"
        onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
        className="pacova-theme-toggle"
      >
        <span aria-hidden="true">{isLight ? '☾' : '☀'}</span>
      </button>
      
      <div className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 pointer-events-none opacity-60" 
          style={{
            background: isLight
              ? 'radial-gradient(ellipse at 50% 0%, rgba(190, 112, 201, 0.48) 0%, rgba(243, 32, 119, 0.12) 42%, transparent 75%)'
              : 'radial-gradient(ellipse at 50% 0%, #510950 0%, transparent 75%)'
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
              linear-gradient(to right, rgba(243, 32, 119, ${isLight ? 0.22 : 0.4}) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(243, 32, 119, ${isLight ? 0.22 : 0.4}) 1px, transparent 1px)
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
            background: isLight
              ? 'linear-gradient(to bottom, rgba(247, 243, 251, 0.05) 0%, rgba(247, 243, 251, 0.25) 55%, #f7f3fb 100%)'
              : 'linear-gradient(to bottom, #050407ff 0%, transparent 30%, #061a04ff 100%)'
          }}
        />
      </div>

      {/* 3. CRT Scanlines Overlay */}
      <div className={`absolute inset-0 pixel-scanlines pointer-events-none z-20 ${isLight ? 'opacity-[0.08]' : 'opacity-30'}`} />

      {/* Page Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-center">
        {children}
      </div>
        <Footer />
    </div>
  );
};

export default Background;
