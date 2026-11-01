import {
  MAZES,
  TIME_LIMITS,
  DIFFICULTIES,
} from "../../../../shared/data/game-data";
import Picker from "./Picker";

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
      <Picker
        icon="👻"
        label="DIFFICULTY"
        value={difficulty}
        options={Object.keys(DIFFICULTIES)}
        onChange={onDifficultyChange}
      />
      <Picker
        icon="🗺️"
        label="MAP"
        value={mazeId}
        options={Object.keys(MAZES)}
        onChange={onMazeIdChange}
      />
      <Picker
        icon="⏱️"
        label="TIME"
        value={String(timeLimit)}
        options={TIME_LIMITS.map((seconds) => String(seconds))}
        onChange={(v) => onTimeLimitChange(Number(v))}
        format={(v) => `${Number(v) / 60} min`}
      />
    </>
  );
};

export default GameSettings;
