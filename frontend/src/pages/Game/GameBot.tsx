import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import GameSetup from "../../components/game/GameSetup";
import { createGame, applyInput, tick } from "../../engine/engine";
import { findSpawn } from "../../engine/maze";
import { chooseDirection } from "../../engine/bot";
import type { BotDifficulty } from "../../engine/bot";
import { DEFAULT_MAZE_ID, DEFAULT_TIME_LIMIT, MAZES } from "../../../../shared/data/game-data";
import type { GameState, Direction } from "../../../../shared/types/game-types";
// UI pieces shared with the local game page (GamePage.tsx)
import MazeUI from "../../components/game/MazeUI";
import HudTop from "../../components/game/HudTop";
import HudPlayer from "../../components/game/HudPlayer";
import MobileControls from "../../components/game/MobileControls";
import { RotDev } from "../../components/game/RotateDevice";
import { MenuButton, PauseMenu, ResultModal } from "../../components/game/GameOverlays";
import { useKeyboard } from "../../hooks/useKeyboard";
import styles from "./GamePage.module.css";

const TICK_INTERVAL_MS = 1000 / 30; // game runs at 30 ticks per second
const CENTER_OFFSET = 4;            // how far each player spawns from the maze center
const HUMAN_ID = "player-1";
const BOT_ID = "ai";

// Human spawns left of the center, bot right of it
function createBotGame(mazeId: string, matchTime: number): GameState {
  const state = createGame(HUMAN_ID, matchTime, mazeId);
  const spawn = findSpawn(MAZES[state.mazeId]);
  const left = { x: spawn.x - CENTER_OFFSET, y: spawn.y };
  const right = { x: spawn.x + CENTER_OFFSET, y: spawn.y };

  state.players[0].spawn = left;
  state.players[0].tile = left;
  state.players.push({
    id: BOT_ID, spawn: right, tile: right, dir: null, nextDir: null, step: 0,
    lives: 3, score: 0, pelletsEaten: 0, fruitsEaten: 0, ghostsEaten: 0,
    connected: true, joinedAt: Date.now(),
  });
  return state;
}

// Same rules as the backend: 1) still has lives  2) higher score  3) draw
function finishLocalMatch(state: GameState) {
  const [human, bot] = state.players;
  if (bot.lives <= 0 && human.lives > 0) state.winnerId = human.id;
  else if (human.lives <= 0 && bot.lives > 0) state.winnerId = bot.id;
  else if (human.score !== bot.score) state.winnerId = human.score > bot.score ? human.id : bot.id;
  else state.winnerId = undefined;
  state.status = "finished";
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; // seconds -> MM:SS

// The match: game loop, inputs, pause and result popup
const BotSession: React.FC<{ mazeId: string; difficulty: BotDifficulty; timeLimit: number; onRestart: () => void }> =
  ({ mazeId, difficulty, timeLimit, onRestart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const togglePause = () => setPaused((p) => !p);

  // The engine changes this object in place every tick. The function form of useState
  // creates the game only ONCE (useRef(createBotGame(...)) would rebuild it on every render).
  const [state] = useState(() => createBotGame(mazeId, timeLimit));
  const [, setFrame] = useState(0); // only used to force a redraw

  // Game loop: bot decision -> engine tick -> redraw
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.status !== "playing" || paused) return;

      const dir = chooseDirection(state, BOT_ID, difficulty); // returns null unless the bot is on a tile center
      if (dir) applyInput(state, BOT_ID, dir);

      tick(state);
      if (state.status !== "playing") finishLocalMatch(state); // engine ends with "won"/"lost" (solo): make it 2-player
      setFrame((f) => f + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state, difficulty, paused]);

  // Escape opens / closes the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && togglePause();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Human input (keyboard or mobile buttons)
  const sendInput = (dir: Direction) => {
    if (state.status === "playing" && !paused) applyInput(state, HUMAN_ID, dir);
  };
  useKeyboard(sendInput, "arrows");
  useKeyboard(sendInput, "wasd");

  const [human, bot] = state.players;
  const playing = state.status === "playing";
  const won = state.winnerId === HUMAN_ID;
  const lost = state.winnerId === BOT_ID;
  const title = won ? t("online_game_you_won") : lost ? t("online_game_you_lost") : t("online_game_draw");

  return (
    <>
      <RotDev />
      {playing && <MobileControls onInput={sendInput} />}
      {playing && !paused && <MenuButton onClick={togglePause} />}

      {/* Game screen: top bar, human on the left, maze, bot on the right */}
      <div className={styles.page}>
        <div className={styles.topBar}><HudTop state={state} /></div>
        <div className={styles.leftBar}><HudPlayer player={human} /></div>
        <div className={styles.mazeWrapper}><MazeUI state={state} mazeId={mazeId} /></div>
        <div className={styles.rightBar}><HudPlayer player={bot} /></div>
      </div>

      {paused && playing && <PauseMenu onResume={togglePause} onQuit={() => navigate("/choose")} />}

      {/* Result popup, shown when the match is over */}
      {!playing && (
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

// Page: first the setup screen (map + difficulty + time), then the match
const BotPage: React.FC = () => {
  const { t } = useTranslation();
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("hard");
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0); // changing the key rebuilds the match = "play again"

  if (!started)
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