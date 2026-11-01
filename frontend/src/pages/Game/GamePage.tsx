import { useSearchParams } from "react-router-dom";
import React, { useState } from "react";
import MazeUI from "../../components/game/MazeUI";
import { useLocalGame } from "../../hooks/useLocalGame";
import { useKeyboard } from "../../hooks/useKeyboard";
import HudTop from "../../components/game/HudTop";
import GameMenu from "../../components/game/GameMenu";
import PixelButton from "../../components/ui/PixelButton";
import type { Direction } from "../../../../shared/types/game-types";
import HudPlayer from "../../components/game/HudPlayer";
import styles from "./GamePage.module.css";
import { RotDev } from "../../components/game/RotateDevice";
import MobileControls from "../../components/game/MobileControls";
import GameSettings from "../../components/game/GameSettings";
import {
  DEFAULT_TIME_LIMIT,
  DEFAULT_MAZE_ID,
  DEFAULT_DIFFICULTY,
} from "../../../../shared/data/game-data";
import Background from "../../components/ui/Background";

const GameSession: React.FC<{
  gameMode: 1 | 2;
  timeLimit: number;
  mazeId: string;
  difficulty: string;
}> = ({ gameMode, timeLimit, mazeId, difficulty }) => {
  const { state, sendInput } = useLocalGame(
    "player-1",
    gameMode,
    timeLimit,
    mazeId,
    difficulty,
  );

  useKeyboard((dir: Direction) => sendInput("player-1", dir), "arrows");
  useKeyboard((dir: Direction) => sendInput("player-2", dir), "wasd");

  const hasPlayer2 = state.players.length > 1;

  return (
    <>
      <RotDev />
      {state.status === "playing" && (
        <MobileControls onInput={(dir) => sendInput("player-1", dir)} />
      )}

      <div className={styles.page}>
        <div className={styles.topBar}>
          <HudTop state={state} />
        </div>

        <div className={styles.leftBar}>
          <HudPlayer player={state.players[0]} />
        </div>

        <div className={styles.mazeWrapper}>
          <MazeUI state={state} mazeId={mazeId} />
        </div>

        {hasPlayer2 && (
          <div className={styles.rightBar}>
            <HudPlayer player={state.players?.[1]} />
          </div>
        )}
      </div>

      {state.status !== "playing" && (
        <div className={styles.gameOverLayout}>
          <h1 className={styles.gameoverstate}>
            {state.status === "won" ? "WIN 🏆" : "GAME OVER"}
          </h1>
          <h1 className={styles.gameOverScore}>
            Score : {state.players[0]?.score ?? 0}
          </h1>
          <div className="flex flex-row gap-6">
            <PixelButton
              variant="outline-green"
              size="lg"
              onClick={() => window.location.reload()}
            >
              RESTART
            </PixelButton>
            <a href="/home" className="inline-flex">
              <PixelButton variant="danger-red" size="lg">
                QUIT
              </PixelButton>
            </a>
          </div>
        </div>
      )}
    </>
  );
};

const GamePage: React.FC = () => {
  const [gameMode, setGameMode] = useState<null | 1 | 2>(null);
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);
  const [started, setStarted] = useState<boolean>(false);

  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get("mode");

  if (urlMode === "local" && gameMode === null) {
    return (
      <>
        <RotDev />
        <GameMenu onSelectMode={(mode) => setGameMode(mode)} />
      </>
    );
  }

  if (gameMode === null) {
    return (
      <>
        <RotDev />
        <GameMenu onSelectMode={(mode) => setGameMode(mode)} />
      </>
    );
  }

  if (!started)
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <RotDev />
          <GameSettings
            difficulty={difficulty}
            timeLimit={timeLimit}
            mazeId={mazeId}
            onDifficultyChange={setDifficulty}
            onTimeLimitChange={setTimeLimit}
            onMazeIdChange={setMazeId}
          />
          <PixelButton variant="filled-green" onClick={() => setStarted(true)}>
            Start
          </PixelButton>
        </div>
      </Background>
    );

  return (
    <GameSession
      key={gameMode}
      gameMode={gameMode}
      timeLimit={timeLimit}
      mazeId={mazeId}
      difficulty={difficulty}
    />
  );
};

export default GamePage;
