import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import GameSetup from "../../components/game/GameSetup";
import { createGame, applyInput, tick } from "../../engine/engine";
import { findSpawn } from "../../engine/maze";
import { DEFAULT_MAZE_ID, DEFAULT_TIME_LIMIT, MAZES } from "../../../../shared/data/game-data";
import { chooseDirection } from '../../engine/bot';
import type { BotDifficulty } from '../../engine/bot';
import type { GameState, Direction } from "../../../../shared/types/game-types";
// Same UI pieces as the local game page (GamePage.tsx)
import MazeUI from "../../components/game/MazeUI";
import HudTop from "../../components/game/HudTop";
import HudPlayer from "../../components/game/HudPlayer";
import MobileControls from "../../components/game/MobileControls";
import { RotDev } from "../../components/game/RotateDevice";
import { useKeyboard } from "../../hooks/useKeyboard";
import styles from "./GamePage.module.css";
import { MenuButton, PauseMenu, ResultModal } from "../../components/game/GameOverlays";
import { useNavigate } from "react-router-dom";


const TICK_INTERVAL_MS = 1000 / 30; // game runs at 30 ticks per second
const CENTER_OFFSET = 4; // how far each player spawns from the maze center
const HUMAN_ID = "player-1";
const BOT_ID = "ai";


// Creates the game: the human spawns left of the center, the bot right of it
function createBotGame(mazeId: string, matchTime: number): GameState {
  const state = createGame(HUMAN_ID, matchTime, mazeId);
  const spawn = findSpawn(MAZES[state.mazeId]);

  state.players[0].spawn = { x: spawn.x - CENTER_OFFSET, y: spawn.y };
  state.players[0].tile = { x: spawn.x - CENTER_OFFSET, y: spawn.y };

  state.players.push({
    id: BOT_ID,
    spawn: { x: spawn.x + CENTER_OFFSET, y: spawn.y },
    tile: { x: spawn.x + CENTER_OFFSET, y: spawn.y },
    dir: null,
    nextDir: null,
    step: 0,
    lives: 3,
    score: 0,
    pelletsEaten: 0,
    fruitsEaten: 0,
    ghostsEaten: 0,
    connected: true,
    joinedAt: Date.now(),
  });

  return state;
}


// Decides the winner when the match ends (same rules as the backend):
// 1) the one who still has lives  2) the higher score  3) otherwise a draw
function finishLocalMatch(state: GameState): void {
  const [human, bot] = state.players;
  if (!human || !bot) return;

  if (bot.lives <= 0 && human.lives > 0) state.winnerId = human.id;
  else if (human.lives <= 0 && bot.lives > 0) state.winnerId = bot.id;
  else if (human.score > bot.score) state.winnerId = human.id;
  else if (bot.score > human.score) state.winnerId = bot.id;
  else state.winnerId = undefined;

  state.status = "finished";
}


// Seconds -> "MM:SS"
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;


// The match itself: game loop, human input, bot input, and the result popup
const BotSession: React.FC<{ mazeId: string; difficulty: BotDifficulty; timeLimit: number; onRestart: () => void }> = ({
  mazeId,
  difficulty,
  timeLimit,
  onRestart,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const togglePause = () => setPaused((p) => !p);

  // The game state lives in a ref (changes every tick); `setFrame` only forces a re-render
  const stateRef = useRef<GameState>(createBotGame(mazeId, timeLimit));
  const [, setFrame] = useState(0);

  // Game loop: bot decision -> engine tick -> redraw
  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current;
      if (state.status !== "playing") return;

      // The bot only decides at tile centers
      const bot = state.players.find((p) => p.id === BOT_ID);
      if (bot && bot.step === 0) {
        const dir = chooseDirection(state, BOT_ID, difficulty);
        if (dir) applyInput(state, BOT_ID, dir);
      }

      tick(state);

      // The engine ends with "won" / "lost" (solo game): convert to the 2-player "finished"
      if (state.status !== "playing") finishLocalMatch(state);

      setFrame((f) => f + 1);
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [difficulty, paused]);

  // Escape opens / closes the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  // Human input (keyboard or mobile buttons)
  const sendInput = (dir: Direction) => {
    const state = stateRef.current;
    if (state.status !== "playing" || paused) return;
    applyInput(state, HUMAN_ID, dir);
  };

  // The human can use arrows or WASD
  useKeyboard(sendInput, "arrows");
  useKeyboard(sendInput, "wasd");


  const state = stateRef.current;
  const [human, bot] = state.players;

  // Result popup texts
  const won = state.winnerId === HUMAN_ID;
  const lost = state.winnerId === BOT_ID;
    const title = won ? t("online_game_you_won") : lost ? t("online_game_you_lost") : t("online_game_draw");

  return (
    <>
      <RotDev />
      {state.status === "playing" && <MobileControls onInput={sendInput} />}
      {state.status === "playing" && !paused && <MenuButton onClick={togglePause} />}

      {/* Game screen: top bar, human on the left, maze, bot on the right */}
      <div className={styles.page}>
        <div className={styles.topBar}>
          <HudTop state={state} />
        </div>

        <div className={styles.leftBar}>
          <HudPlayer player={human} />
        </div>

        <div className={styles.mazeWrapper}>
          <MazeUI state={state} mazeId={mazeId} />
        </div>

        <div className={styles.rightBar}>
          <HudPlayer player={bot} />
        </div>
      </div>

      {/* Result popup, shown when the match is over */}
      {paused && state.status === "playing" && (
        <PauseMenu onResume={togglePause} onQuit={() => navigate("/choose")} />
      )}

      {state.status !== "playing" && (
        <ResultModal
          title={title}
          win={won}
          players={[
            { name: t("bot_you"), score: human.score, lives: human.lives, win: won },
            { name: t("bot_bot"), score: bot.score, lives: bot.lives, win: lost },
          ]}
          onPlayAgain={onRestart}
          onQuit={() => navigate("/choose")}
        >
          <p className="font-vt323 text-xl text-white/70">
            {t("bot_time", { time: fmt(timeLimit - state.timeRemaining) })}
          </p>
        </ResultModal>
      )}
    </>
  );
};


// Page: first a setup screen (map + difficulty), then the match
const BotPage: React.FC = () => {
  const { t } = useTranslation();
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("hard");
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0); // bump to restart with the same settings
  
  // Setup screen
  if (!started) {
    return (
      <GameSetup
        difficulty={difficulty}
        mazeId={mazeId}
        timeLimit={timeLimit}
        onDifficultyChange={(d) => setDifficulty(d as BotDifficulty)}
        onMazeIdChange={setMazeId}
        onTimeLimitChange={setTimeLimit}
        onStart={() => setStarted(true)}
        startLabel={t("bot_start")}
      />
    );
  }

    return (
    <BotSession
      key={run}
      mazeId={mazeId}
      difficulty={difficulty}
      timeLimit={timeLimit}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
};

export default BotPage;