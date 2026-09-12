import React from "react";

export type PixelButtonVariant =
  | "outline-magenta"
  | "outline-green"
  | "filled-green"
  | "filled-pink"
  | "olive-yellow"
  | "filled-magenta"
  | "solid-pink"
  | "danger-red"
  | "warning-yellow";

export type PixelButtonSize = "sm" | "md" | "lg";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<
  PixelButtonVariant,
  {
    bg: string;
    glow: string;
    dropShadow: string;
    borderColor: string;
    textColor?: string;
    fontFamily?: string;
  }
> = {
  "outline-magenta": {
    bg: "bg-pacova-surface",
    glow: "shadow-neon-pink",
    borderColor: "border-pacova-pink",
    dropShadow: "drop-shadow-glow-pink",
    textColor: "text-pacova-pink",
  },
  "outline-green": {
    bg: "bg-pacova-surface",
    glow: "shadow-neon-green",
    borderColor: "border-pacova-green",
    dropShadow: "drop-shadow-glow-green",
    textColor: "text-pacova-green",
  },
  "filled-green": {
    bg: "bg-pacova-green-dark",
    glow: "shadow-neon-green",
    borderColor: "border-pacova-green",
    dropShadow: "drop-shadow-glow-green",
  },
  "olive-yellow": {
    bg: "bg-pacova-green-dark/60",
    glow: "shadow-neon-green/40",
    borderColor: "border-pacova-green/50",
    dropShadow: "drop-shadow-glow-green",
  },
  "filled-magenta": {
    bg: "bg-pacova-pink-dark",
    glow: "shadow-neon-pink",
    borderColor: "border-pacova-pink",
    dropShadow: "drop-shadow-glow-pink",
  },
  "filled-pink": {
    bg: "bg-pacova-pink-dark",
    glow: "shadow-neon-pink",
    borderColor: "border-pacova-pink",
    dropShadow: "drop-shadow-glow-pink",
  },
  "solid-pink": {
    bg: "bg-pacova-pink",
    glow: "shadow-neon-pink",
    borderColor: "border-white/60",
    dropShadow: "drop-shadow-glow-pink",
  },
  "danger-red": {
    bg: "bg-red-950",
    glow: "shadow-[inset_0_0_15px_rgba(239,68,68,0.6)]",
    borderColor: "border-red-500",
    dropShadow: "drop-shadow-glow-red",
  },
  "warning-yellow": {
    bg: "bg-amber-950",
    glow: "shadow-[inset_0_0_12px_rgba(245,158,11,0.6)]",
    borderColor: "border-amber-400",
    dropShadow: "drop-shadow-glow-yellow",
  },
};

const sizeStyles: Record<PixelButtonSize, string> = {
  sm: "px-6 py-2 text-xl tracking-wide",
  md: "px-10 py-3.5 text-3xl tracking-wider",
  lg: "px-14 py-5 text-3xl tracking-widest",
};

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = "outline-magenta",
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const currentVariant = variantStyles[variant];

  return (
    <div
      className={`inline-block ${currentVariant.dropShadow} transition-transform duration-100 active:scale-95`}
    >
      <button
        disabled={disabled}
        className={`
          relative
          font-vt323
          uppercase
          pixel-corners-3step
          cursor-pointer
          select-none
          transition-all
          duration-150
          hover:brightness-125
          disabled:opacity-20
          disabled:cursor-not-allowed
          disabled:shadow-none
          ${currentVariant.textColor || "text-white"}   {/* 👈 Dynamic color or fallback */}
          ${currentVariant.fontFamily || ""}             {/* 👈 Dynamic font fallback */}
          ${currentVariant.bg}
          ${currentVariant.glow}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props} //Cela t'évite d'avoir à écrire manuellement chaque attribut HTML un par un (onClick={onClick} disabled={disabled} type={type}...).
      >
        {/* CRT Scanline Overlay */}
        <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

        {/* Pixel Border Overlay that clips properly with pixel-corners-3step */}
        <span
          className={`absolute inset-0 border-2 ${currentVariant.borderColor} pixel-corners-3step pointer-events-none`}
        />

        {/* Button Content */}
        <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {children}
        </span>
      </button>
    </div>
  );
};

export default PixelButton;

// pixel-corners-3step
