export default function ReadPellet({ read }: { read: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 pixel-corners-3step transition-all duration-300 ${
        read
          ? 'bg-pacova-green shadow-neon-pink'
          : 'bg-transparent border border-pacova-pink/50'
      }`}
      aria-label={read ? 'Read' : 'Sent'}
      title={read ? 'Read' : 'Sent'}
    />
  );
}