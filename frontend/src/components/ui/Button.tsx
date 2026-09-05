type ButtonVariant = 'pink' | 'green'
type ButtonStyle = 'filled' | 'outline' | 'disabled'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  styleType?: ButtonStyle
}

export default function Button({
  variant = 'pink',
  styleType = 'filled',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = 'font-display text-xs py-3 rounded transition disabled:cursor-not-allowed'

  const styles: Record<string, string> = {
    'pink-filled': 'bg-neon-pink text-white shadow-[0_0_12px_#F32077] hover:brightness-110',
    'pink-outline': 'border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10',
    'green-filled': 'bg-neon-green text-deep-space shadow-[0_0_12px_#8ED603] hover:brightness-110',
    'green-outline': 'border-2 border-neon-green text-neon-green hover:bg-neon-green/10',
    disabled: 'bg-gray-700 text-gray-400',
  }

  const key = styleType === 'disabled' ? 'disabled' : `${variant}-${styleType}`

  return (
    <button
      className={`${base} ${styles[key]} ${className}`}
      disabled={styleType === 'disabled' || props.disabled}
      {...props}
    >
      {children}
    </button>
  )
}