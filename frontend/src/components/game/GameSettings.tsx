import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <>
      <Picker
        icon="👻"
        label={t("local_game_difficulty")}
        value={difficulty}
        options={Object.keys(DIFFICULTIES)}
        onChange={onDifficultyChange}
        format={(v) => t(`bot_${v}`)}
      />
      <Picker
        icon="🗺️"
        label={t("local_game_map")}
        value={mazeId}
        options={Object.keys(MAZES)}
        onChange={onMazeIdChange}
        format={(v) => t(`game_map_${v}`)}
      />
      <Picker
        icon="⏱️"
        label={t("local_game_time")}
        value={String(timeLimit)}
        options={TIME_LIMITS.map((seconds) => String(seconds))}
        onChange={(v) => onTimeLimitChange(Number(v))}
        format={(v) => `${Number(v) / 60} ${t("local_game_minutes")}`}
      />
    </>
  );
};

export default GameSettings;
