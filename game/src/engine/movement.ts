import type { Chaser, Direction, Player, Tile } from "../../../shared/types/game-types";
import { isWall } from "./maze";

export const TICKS_PER_TILE = 8;

export const ahead = (tile: Tile, dir: Direction) => {
  switch (dir) {
    case "UP":
      return { x: tile.x, y: tile.y - 1 };
    case "DOWN":
      return { x: tile.x, y: tile.y + 1 };
    case "LEFT":
      return { x: tile.x - 1, y: tile.y };
    case "RIGHT":
      return { x: tile.x + 1, y: tile.y };
  }
};

export const stepPlayer = (player: Player) => {
  if (player.step === 0) {
    if (player.nextDir !== null) {
      if (!isWall(ahead(player.tile, player.nextDir))) {
        player.dir = player.nextDir;
        player.nextDir = null;
      }
    }
    if (player.dir !== null) {
      if (isWall(ahead(player.tile, player.dir))) {
        player.dir = null;
      }
    }
  }
  if (player.dir !== null) {
    player.step++;
    if (player.step >= TICKS_PER_TILE) {
      player.tile = ahead(player.tile, player.dir);
      player.step = 0;
    }
  }
};
export const stepChaser = (chaser: Chaser) => {

  if (chaser.dir != null) {
    chaser.step++;
    if (chaser.step >= TICKS_PER_TILE) {
      chaser.tile = ahead(chaser.tile, chaser.dir);
      chaser.step = 0;
    }
  }
};
