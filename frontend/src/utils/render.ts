import type {
  Tile,
  Direction,
  GameState,
} from "../../../shared/types/game-types";
import { MAZES } from "../engine/maze";
import { TICKS_PER_TILE } from "../engine/movement";
import { ahead } from "../engine/movement";

const TILE_SIZE = 32;

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
export const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const maze = MAZES[state.mazeId];
  const width = maze[0].length;
  const height = maze.length;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, TILE_SIZE * width, TILE_SIZE * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (maze[y][x] == "#") {
        ctx.fillStyle = "purple";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (state.pellets[y][x]) {
        ctx.fillStyle = "yellow";
        if (maze[y][x] == "o")
          ctx.fillRect(
            x * TILE_SIZE + TILE_SIZE / 3,
            y * TILE_SIZE + TILE_SIZE / 3,
            TILE_SIZE / 2,
            TILE_SIZE / 2,
          );
        else
          ctx.fillRect(
            x * TILE_SIZE + TILE_SIZE / 3,
            y * TILE_SIZE + TILE_SIZE / 3,
            TILE_SIZE / 3,
            TILE_SIZE / 3,
          );
      }
    }
  }
  state.chasers.forEach((chaser) => {
    ctx.fillStyle = state.vulnerableTimer && !chaser.isEaten ? "grey" : "red";
    const pos = getDrawPosition(chaser.tile, chaser.dir, chaser.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
  ctx.fillStyle = "blue";
  state.players.forEach((player) => {
    const pos = getDrawPosition(player.tile, player.dir, player.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
};
