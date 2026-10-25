import { useEffect, useRef, useState } from "react";
import { createGame, applyInput, tick } from "../engine/engine";
import type {
  GameState,
  Direction,
  GameStatus,
} from "../../../shared/types/game-types";
// import { ahead, TICKS_PER_TILE } from "../engine/movement";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import PixelButton from "../components/ui/PixelButton";
import { draw } from "../utils/render";
import { DEFAULT_MAZE_ID, MAZES } from "../engine/maze";
// import Badge from "../components/ui/Badge";

const TILE_SIZE = 32;
const KEY_MAP: Record<string, Direction> = {
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT",
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number>(undefined);
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const stateRef = useRef<GameState>(createGame("local", 360, mazeId));
  const [started, setStarted] = useState<boolean>(false);
  const maze = MAZES[mazeId];

  const startLoop = (ctx: CanvasRenderingContext2D) => {
    intervalRef.current = setInterval(() => {
      tick(stateRef.current);
      setHud({
        players: stateRef.current.players.map(({ score, lives }) => ({
          score,
          lives,
        })),
        timeRemaining: stateRef.current.timeRemaining,
        status: stateRef.current.status,
      });

      if (stateRef.current.status !== "playing")
        clearInterval(intervalRef.current);
      draw(ctx, stateRef.current);
    }, 1000 / 30);
  };

  const restart = () => {
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    stateRef.current = createGame("local", 360, mazeId);

    setHud({
      players: stateRef.current.players.map(({ score, lives }) => ({
        score,
        lives,
      })),
      timeRemaining: stateRef.current.timeRemaining,
      status: stateRef.current.status,
    });
    startLoop(ctx);
  };

  const [hud, setHud] = useState<{
    players: { score: number; lives: number }[];
    timeRemaining: number;
    status: GameStatus;
  }>({ players: [], timeRemaining: 360, status: "playing" });

  useEffect(() => {
    if (!started) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        applyInput(stateRef.current, "local", dir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    stateRef.current = createGame("local", 360, mazeId);

    setHud({
      players: stateRef.current.players.map(({ score, lives }) => ({
        score,
        lives,
      })),
      timeRemaining: stateRef.current.timeRemaining,
      status: stateRef.current.status,
    });
    startLoop(ctx);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(intervalRef.current);
    };
  }, [started]);

  if (!started)
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <select
            value={mazeId}
            onChange={(e) => setMazeId(e.target.value)}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {Object.keys(MAZES).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <PixelButton onClick={() => setStarted(true)}>Start</PixelButton>
        </div>
      </ArenaBackground>
    );

  return (
    <ArenaBackground>
      <div className="flex-1 flex-col flex items-center justify-center gap-4">
        <div className="flex gap-4 w-152 justify-between">
          <Badge variant="yellow">timeRemaining: {hud.timeRemaining} </Badge>
          {hud.players.map((p, index) => (
            <Badge variant="green">
              Player{index + 1} score: {p.score} lives: {p.lives}
            </Badge>
          ))}
        </div>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={maze[0].length * TILE_SIZE}
            height={maze.length * TILE_SIZE}
          />
          {hud.status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              <Badge variant={hud.status === "won" ? "green" : "red"}>
                {hud.status === "won" ? "You Won!" : "You lost!"}
              </Badge>
              <PixelButton onClick={restart}>Restart</PixelButton>
            </div>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
}
