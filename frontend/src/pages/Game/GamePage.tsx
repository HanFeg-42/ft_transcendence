import { useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import MazeUI from "../../components/game/MazeUI";
import { useLocalGame } from "../../hooks/useLocalGame";
import { useKeyboard } from "../../hooks/useKeyboard";
import HudTop from "../../components/game/HudTop";
import GameMenu from "../../components/game/GameMenu";
// import PixelButton from "../../components/ui/PixelButton";
import { MenuButton, PauseMenu, ResultModal } from "../../components/game/GameOverlays";
import type { Direction } from "../../../../shared/types/game-types";
import HudPlayer from "../../components/game/HudPlayer";
import styles from "./GamePage.module.css";
import { RotDev } from "../../components/game/RotateDevice";
import MobileControls from "../../components/game/MobileControls";
// import GameSettings from "../../components/game/GameSettings";
import {  DEFAULT_TIME_LIMIT,  DEFAULT_MAZE_ID,  DEFAULT_DIFFICULTY,} from "../../../../shared/data/game-data";
// import Background from "../../components/ui/Background";
import { useTranslation } from 'react-i18next';
import GameSetup from "../../components/game/GameSetup";



const GameSession: React.FC<{
  gameMode: 1 | 2;
  timeLimit: number;
  mazeId: string;
  // difficulty: string;}> = ({ gameMode, timeLimit, mazeId, difficulty }) => {
  difficulty: string;
  onRestart: () => void;}> = ({ gameMode, timeLimit, mazeId, difficulty, onRestart }) => {
  const { state, sendInput, paused, togglePause } = useLocalGame(
    "player-1",
    gameMode,
    timeLimit,
    mazeId,
    difficulty,
  );
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePause]);
  useKeyboard((dir: Direction) => sendInput("player-1", dir), "arrows");
  useKeyboard((dir: Direction) => sendInput("player-2", dir), "wasd");

  const hasPlayer2 = state.players.length > 1;

  return (
    <>
      <RotDev />
      {/* {state.status === "playing" && !paused && (
        <div className="fixed top-4 right-4 z-50">
          <PixelButton variant="outline-green" size="sm" onClick={togglePause}>
            {t('local_game_pause')}
          </PixelButton>
        </div>
      )} */}
      {state.status === "playing" && !paused && <MenuButton onClick={togglePause} />}
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

      {/* {paused && state.status === "playing" && (
        <div className={styles.gameOverLayout}>
          <h1 className={styles.gameoverstate}>{t('local_game_pause')}</h1>
          <div className="flex flex-row gap-6">
            <PixelButton variant="outline-green" size="lg" onClick={togglePause}>
              {t('local_game_resume')}
            </PixelButton>
            <PixelButton variant="danger-red" size="lg" onClick={() => navigate("/home")}>
              {t('local_game_quit')}
            </PixelButton>
          </div>
        </div>
      )}

      {state.status !== "playing" && (
        <div className={styles.gameOverLayout}>
          <h1 className={styles.gameoverstate}>
            {state.status === "won"
              ? `${t('local_game_win')} 🏆`
              : t('local_game_over')}
          </h1>
          <h1 className={styles.gameOverScore}>
            {t('local_game_score_label')} : {state.players[0]?.score ?? 0}
          </h1>
          <div className="flex flex-row gap-6">
            <PixelButton
              variant="outline-green"
              size="lg"
              onClick={() => window.location.reload()}
            >
              {t('local_game_restart')}
            </PixelButton>
            <a href="/home" className="inline-flex">
              <PixelButton variant="danger-red" size="lg">
                {t('local_game_quit')}
              </PixelButton>
            </a>
          </div>
        </div>
      )} */}

      {paused && state.status === "playing" && (
        <PauseMenu onResume={togglePause} onQuit={() => navigate("/choose")} />
      )}

      {state.status !== "playing" && (
        <ResultModal
          title={state.status === "won" ? t("online_game_you_won") : t("online_game_you_lost")}
          win={state.status === "won"}
          players={state.players.map((p, i) => ({
            name: `P${i + 1}`,
            score: p.score,
            lives: p.lives,
            win: state.status === "won",
          }))}
          onPlayAgain={onRestart}
          onQuit={() => navigate("/choose")}
        />
      )}
    </>
  );
};

const GamePage: React.FC = () => {
  // const { t } = useTranslation();
  const [gameMode, setGameMode] = useState<null | 1 | 2>(null);
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);
  const [started, setStarted] = useState<boolean>(false);
  const [run, setRun] = useState(0); // bump to restart with the same settings

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

  // if (!started)
  //   return (
  //     <Background>
  //       <div className="flex-1 flex flex-col items-center justify-center gap-4">
  //         <RotDev />
  //         <GameSettings
  //           difficulty={difficulty}
  //           timeLimit={timeLimit}
  //           mazeId={mazeId}
  //           onDifficultyChange={setDifficulty}
  //           onTimeLimitChange={setTimeLimit}
  //           onMazeIdChange={setMazeId}
  //         />
  //         <PixelButton variant="filled-green" onClick={() => setStarted(true)}>
  //           {t('local_game_start')}
  //         </PixelButton>
  //       </div>
  //     </Background>
  //   );

if (!started)
  return (
    <GameSetup
      difficulty={difficulty}
      mazeId={mazeId}
      timeLimit={timeLimit}
      onDifficultyChange={setDifficulty}
      onMazeIdChange={setMazeId}
      onTimeLimitChange={setTimeLimit}
      onStart={() => setStarted(true)}
    />
  );

  return (
    // <GameSession
    //   key={gameMode}
    //   gameMode={gameMode}
    //   timeLimit={timeLimit}
    //   mazeId={mazeId}
    //   difficulty={difficulty}
    // />

    <GameSession
      key={`${gameMode}-${run}`}
      gameMode={gameMode}
      timeLimit={timeLimit}
      mazeId={mazeId}
      difficulty={difficulty}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
};

export default GamePage;
