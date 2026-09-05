import { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, type, className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1">
      <label className="font-body text-neon-pink text-xs uppercase tracking-wide">
        {label}
      </label>

      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full bg-transparent border border-neon-pink rounded px-3 py-2 text-white placeholder-neon-pink/40 outline-none focus:shadow-[0_0_8px_#F32077] ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-pink/70 hover:text-neon-pink"
          >
            {/* {showPassword ? '🙈' : '👁️'} */}
          </button>
        )}
      </div>
    </div>
  )
}