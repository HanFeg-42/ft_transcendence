import { useEffect, useRef } from "react";
import { MAZE, WIDTH, HEIGHT } from "../engine/maze";
import { createGame, applyInput, tick } from "../engine/engine";
import type { GameState, Direction, Tile } from "../engine/types";
import { ahead, TICKS_PER_TILE } from "../engine/movement";

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
  const stateRef = useRef<GameState>(createGame([123]));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) applyInput(stateRef.current, 123, dir);
    };
    window.addEventListener("keydown", handleKeyDown);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const interval = setInterval(() => {
      tick(stateRef.current);
      if (stateRef.current.status !== "playing") clearInterval(interval);
      draw(ctx, stateRef.current);
    }, 1000 / 30);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="flex-1 flex items-center justify-center">
      <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
        <canvas
          ref={canvasRef}
          width={WIDTH * TILE_SIZE}
          height={HEIGHT * TILE_SIZE}
        />{" "}
      </h1>
    </div>
  );
}
