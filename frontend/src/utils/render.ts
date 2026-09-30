import type {
  Tile,
  Direction,
  GameState,
} from "../../../shared/types/game-types";
import { TICKS_PER_TILE } from "../engine/movement";
import { ahead } from "../engine/movement";
import { MAZE, WIDTH, HEIGHT } from "../engine/maze";

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
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, TILE_SIZE * WIDTH, TILE_SIZE * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (MAZE[y][x] == "#") {
        ctx.fillStyle = "purple";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (state.pellets[y][x]) {
        ctx.fillStyle = "yellow";
        if (MAZE[y][x] == "o")
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
