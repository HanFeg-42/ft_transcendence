interface BackgroundProps {
  children: React.ReactNode
}

export default function Background({ children }: BackgroundProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-deep-space bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/src/assets/images/Background.png')" }}
    >
      {children}
    </div>
  )
}