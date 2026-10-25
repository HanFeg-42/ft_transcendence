
import { useEffect, useRef, useState } from "react";
import {
  createGame,
  applyInput,
  tick,
} from "../engine/engine";
import type {
  GameState,
  GameStatus,
  Direction,
} from "../../../shared/types/game-types";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import PixelButton from "../components/ui/PixelButton";
import { draw } from "../utils/render";
import { DEFAULT_MAZE_ID, MAZES, findSpawn } from "../engine/maze";
import { chooseDirection } from "../ai/bot";
import type { BotDifficulty } from "../ai/bot";





const TILE_SIZE = 32;
const CENTER_OFFSET = 4;

type BotHud = {
  players: { id: string; score: number; lives: number }[];
  timeRemaining: number;
  status: GameStatus;
  winnerId?: string;
};

/**
 * BotTest-only multiplayer setup.
 * We reproduce the backend's spawn logic here without modifying the engine.
 */
function createBotGame(mazeId: string): GameState {
  const state = createGame("local", 360, mazeId);
  const spawn = findSpawn(MAZES[state.mazeId]);

  const humanSpawn = {
    x: spawn.x - CENTER_OFFSET,
    y: spawn.y,
  };

  const botSpawn = {
    x: spawn.x + CENTER_OFFSET,
    y: spawn.y,
  };

  state.players[0].spawn = { ...humanSpawn };
  state.players[0].tile = { ...humanSpawn };

  state.players.push({
    id: "ai",
    spawn: { ...botSpawn },
    tile: { ...botSpawn },
    dir: null,
    nextDir: null,
    step: 0,
    lives: 3,
    score: 0,
    pelletsEaten: 0, // Added to satisfy Player type
    ghostsEaten: 0,
    connected: true,
    joinedAt: Date.now(),
  });

  return state;
}

function readHud(state: GameState): BotHud {
  return {
    players: state.players.map(({ id, score, lives }) => ({
      id,
      score,
      lives,
    })),
    timeRemaining: state.timeRemaining,
    status: state.status,
    winnerId: state.winnerId,
  };
}

function finishLocalMatch(state: GameState): void {
  const [human, bot] = state.players;

  if (!human || !bot) return;

  // Match the backend's winner selection rules.
  if (bot.lives <= 0 && human.lives > 0) {
    state.winnerId = human.id;
  } else if (human.lives <= 0 && bot.lives > 0) {
    state.winnerId = bot.id;
  } else if (human.score > bot.score) {
    state.winnerId = human.id;
  } else if (bot.score > human.score) {
    state.winnerId = bot.id;
  } else {
    state.winnerId = undefined;
  }

  state.status = "finished";
}

export default function BotTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [difficulty, setDifficulty] = useState<BotDifficulty>("hard");
  const [started, setStarted] = useState(false);

  const stateRef = useRef<GameState>(createBotGame(mazeId));

  const [hud, setHud] = useState<BotHud>(() =>
    readHud(stateRef.current),
  );

  const maze = MAZES[mazeId];

  const startLoop = (ctx: CanvasRenderingContext2D) => {
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      const state = stateRef.current;

      // The AI controls only the second player.
      const bot = state.players.find((player) => player.id === "ai");

      // Choose a direction only at tile centers.
      if (bot && bot.step === 0 && state.status === "playing") {
        // const direction = chooseDirection(state, "ai");
        const direction = chooseDirection(
    stateRef.current,
    "ai",
    difficulty
);

        if (direction) {
          applyInput(state, "ai", direction);
        }
      }

      tick(state);

      // The existing frontend engine uses "won"/"lost".
      // Convert that result to the multiplayer "finished" state locally.
      if (state.status !== "playing") {
        finishLocalMatch(state);
      }

      setHud(readHud(state));
      draw(ctx, state);

      if (state.status !== "playing") {
        if (intervalRef.current !== undefined) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }
    }, 1000 / 30);
  };

  const restart = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    stateRef.current = createBotGame(mazeId);
    setHud(readHud(stateRef.current));
    draw(ctx, stateRef.current);
    startLoop(ctx);
  };

  // Keyboard controls for the human player.
  useEffect(() => {
    if (!started) return;

    const keyDirections: Record<string, Direction> = {
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      w: "UP",
      s: "DOWN",
      a: "LEFT",
      d: "RIGHT",
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyDirections[event.key];

      if (!direction) return;

      event.preventDefault();
      applyInput(stateRef.current, "local", direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [started, mazeId, difficulty]);

  // Create a fresh two-player game when starting or changing the map.
  useEffect(() => {
    if (!started) return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    stateRef.current = createBotGame(mazeId);
    setHud(readHud(stateRef.current));
    draw(ctx, stateRef.current);
    startLoop(ctx);

    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [started, mazeId]);

  if (!started) {
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <select
            value={mazeId}
            onChange={(event) => setMazeId(event.target.value)}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {Object.keys(MAZES).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <select
  value={difficulty}
  onChange={(e) => setDifficulty(e.target.value as BotDifficulty)}
  className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 px-3 py-2 rounded-md outline-none cursor-pointer"
>
  <option value="easy">Easy</option>
  <option value="normal">Normal</option>
  <option value="hard">Hard</option>
</select>

          <PixelButton onClick={() => setStarted(true)}>
            Start
          </PixelButton>
        </div>
      </ArenaBackground>
    );
  }

  return (
    <ArenaBackground>
      <div className="flex-1 flex-col flex items-center justify-center gap-4">
        <div className="flex flex-wrap gap-4 w-152 justify-between">
          <Badge variant="yellow">
            Time: {hud.timeRemaining}
          </Badge>

          {hud.players.map((player) => (
            <Badge key={player.id} variant="green">
              {player.id === "ai" ? "Bot" : "You"} — Score:{" "}
              {player.score} | Lives: {player.lives}
            </Badge>
          ))}
        </div>

        <p className="text-white/80 text-sm">
          Move with the arrow keys or W, A, S, D.
        </p>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={maze[0].length * TILE_SIZE}
            height={maze.length * TILE_SIZE}
          />

          {hud.status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              <Badge
                variant={
                  hud.winnerId === "local"
                    ? "green"
                    : hud.winnerId === "ai"
                      ? "red"
                      : "yellow"
                }
              >
                {hud.winnerId === "local"
                  ? "You won!"
                  : hud.winnerId === "ai"
                    ? "Bot won!"
                    : "It's a tie!"}
              </Badge>

              <PixelButton onClick={restart}>
                Restart
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
}
