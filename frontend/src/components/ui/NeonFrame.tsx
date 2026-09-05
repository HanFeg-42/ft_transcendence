type FrameVariant = 'pink' | 'green'
type FrameSize = 'sm' | 'md' | 'lg'

interface NeonFrameProps {
  variant?: FrameVariant
  size?: FrameSize
  children: React.ReactNode
  className?: string
}

export default function NeonFrame({
  variant = 'pink',
  size = 'md',
  children,
  className = '',
}: NeonFrameProps) {
  const colors = {
    pink: 'border-neon-pink shadow-[0_0_25px_#F32077]',
    green: 'border-neon-green shadow-[0_0_25px_#8ED603]',
  }

  const sizes = {
    sm: 'max-w-xs p-6',
    md: 'max-w-sm p-8',
    lg: 'max-w-md p-10',
  }

  return (
    <div
      className={`w-full ${sizes[size]} bg-deep-space border-2 rounded-lg ${colors[variant]} ${className}`}
    >
      {children}
    </div>
  )
}