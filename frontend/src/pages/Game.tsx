import { useEffect, useRef, useState } from "react";
import { MAZE, WIDTH, HEIGHT } from "../engine/maze";
import { createGame, applyInput, tick } from "../engine/engine";
import type {
  GameState,
  Direction,
  Tile,
  GameStatus,
} from "../../../shared/types/game-types";
import { ahead, TICKS_PER_TILE } from "../engine/movement";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import PixelButton from "../components/ui/PixelButton";
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

const getDrawPosition = (
  tile: Tile,
  dir: Direction | null,
  step: number,
): Tile => {
  if (!dir) return { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE };
  const target = ahead(tile, dir);
  const progress = step / TICKS_PER_TILE;

  return {
    x: (tile.x + (target.x - tile.x) * progress) * TILE_SIZE,
    y: (tile.y + (target.y - tile.y) * progress) * TILE_SIZE,
  };
};
const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, TILE_SIZE * WIDTH, TILE_SIZE * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (MAZE[y][x] == "#") {
        ctx.fillStyle = "purple";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (state.pellets[y][x]) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(
          x * TILE_SIZE + TILE_SIZE / 3,
          y * TILE_SIZE + TILE_SIZE / 3,
          TILE_SIZE / 3,
          TILE_SIZE / 3,
        );
      }
    }
  }
  ctx.fillStyle = "red";
  state.chasers.forEach((chaser) => {
    const pos = getDrawPosition(chaser.tile, chaser.dir, chaser.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
  ctx.fillStyle = "blue";
  state.players.forEach((player) => {
    const pos = getDrawPosition(player.tile, player.dir, player.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
};

export default function Game() {
  const stateRef = useRef<GameState>(createGame("local"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number>(undefined);

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

    stateRef.current = createGame("local");

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
  }, []);
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
            width={WIDTH * TILE_SIZE}
            height={HEIGHT * TILE_SIZE}
          />
          {hud.status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              <Badge variant={hud.status === "won" ? "green" : "red"}>
                {hud.status === "won" ? "You Win!" : "Game Over"}
              </Badge>
              <PixelButton onClick={restart}>Restart</PixelButton>
            </div>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
}
