// One side of the result: name, score, hearts left. The winner shines green.
const Result: React.FC<{
  name: string;
  score: number;
  lives: number;
  win: boolean;
}> = ({ name, score, lives, win }) => (
  <div
    className={`flex-1 p-3 rounded-xl border-2 text-center bg-pacova-purple/40 ${
      win
        ? "border-pacova-green shadow-neon-green"
        : "border-white/20 opacity-70"
    }`}
  >
    <p
      className={`font-press-start text-sm ${win ? "text-pacova-green drop-shadow-glow-green" : "text-white/60"}`}
    >
      {name}
    </p>
    <p className="font-pixelify text-4xl text-white my-2">{score}</p>
    <p className="text-2xl">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            i < lives
              ? "text-pacova-pink drop-shadow-glow-pink"
              : "text-white/20"
          }
        >
          ♥
        </span>
      ))}
    </p>
  </div>
);

export default Result;
