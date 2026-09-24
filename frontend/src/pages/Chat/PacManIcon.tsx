function PacManIcon({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      fill="#FFD400"
      aria-hidden="true"
    >
      <path d="M12 12 L20.66 7 A10 10 0 1 0 20.66 17 Z" />
    </svg>
  );
}

export default PacManIcon;