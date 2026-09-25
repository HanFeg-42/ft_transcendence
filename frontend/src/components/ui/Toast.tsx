import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
}) => {
  const typeStyles = {
    success: 'border-pacova-green text-pacova-green shadow-neon-green',
    error: 'border-red-500 text-red-500 drop-shadow-glow-red',
    info: 'border-pacova-pink text-pacova-pink shadow-neon-pink',
  };

  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      bg-pacova-surface 
      border-2 
      pixel-corners-3step 
      px-6 py-3 
      flex items-center gap-4 
      font-pixelify text-xl uppercase tracking-wide 
      ${typeStyles[type]}
    `}>
      <span className="absolute inset-0 pixel-scanlines pointer-events-none" />
      <span className="relative z-10">{message}</span>
      
      {onClose && (
        <button 
          onClick={onClose} 
          className="relative z-10 text-gray-400 hover:text-white cursor-pointer ml-2"
        >
          [X]
        </button>
      )}
    </div>
  );
};

export default Toast;