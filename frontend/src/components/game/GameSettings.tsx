import {
  MAZES,
  TIME_LIMITS,
  DIFFICULTIES,
} from "../../../../shared/data/game-data";

const GameSettings = ({
  difficulty,
  timeLimit,
  mazeId,
  onDifficultyChange,
  onMazeIdChange,
  onTimeLimitChange,
}: {
  difficulty: string;
  mazeId: string;
  timeLimit: number;
  onDifficultyChange: (difficulty: string) => void;
  onMazeIdChange: (mazeId: string) => void;
  onTimeLimitChange: (timeLimit: number) => void;
}) => {
  return (
    <>
      <select
        value={difficulty}
        onChange={(e) => onDifficultyChange(e.target.value)}
        className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
      >
        {Object.keys(DIFFICULTIES).map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>

      <select
        value={mazeId}
        onChange={(e) => onMazeIdChange(e.target.value)}
        className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
      >
        {Object.keys(MAZES).map((maze) => (
          <option key={maze} value={maze}>
            {maze}
          </option>
        ))}
      </select>

      <select
        value={timeLimit}
        onChange={(e) => onTimeLimitChange(Number(e.target.value))}
        className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
      >
        {TIME_LIMITS.map((seconds) => (
          <option key={seconds} value={seconds}>
            {seconds / 60} min
          </option>
        ))}
      </select>
    </>
  );
};

export default GameSettings;
