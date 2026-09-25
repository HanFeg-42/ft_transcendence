import type {
  GameState,
  Player,
  Chaser,
  Tile,
  Direction,
} from "../../../shared/types/game-types";
import {
  findChaserSpawns,
  findSpawn,
  parsePellets,
  isWall,
  MAZE,
} from "./maze";
import { stepPlayer, stepChaser, ahead } from "./movement";

const TICKS_PER_SECOND = 30;

export const createGame = (
  playerId: string,
  timeLimit: number = 360,
): GameState => {
  const players: Player[] = [
    {
      id: playerId,
      spawn: findSpawn(),
      tile: findSpawn(),
      dir: null,
      nextDir: null,
      step: 0,
      lives: 3,
      score: 0,
      connected: true
    },
  ];

  const chasers: Chaser[] = findChaserSpawns().map((tile, index) => {
    return {
      id: index,
      spawn: tile,
      tile,
      dir: null,
      step: 0,
    };
  });
  return {
    tick: 0,
    status: "playing",
    players,
    chasers,
    pellets: parsePellets(),
    timeRemaining: timeLimit,
  };
};

const tilesAreEqual = (a: Tile, b: Tile): boolean => {
  return a.x == b.x && a.y == b.y;
};

export const applyInput = (
  state: GameState,
  playerId: string,
  dir: Direction,
) => {
  const player = state.players.find((p) => p.id === playerId);
  if (player) player.nextDir = dir;
};

const pickChaserDirection = (chaser: Chaser, state: GameState) => {
  let bestDistance = Infinity;
  let bestDir = null;

  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  const validDirections = directions.filter((dir: Direction) => {
    const next = ahead(chaser.tile, dir);
    if (isWall(next)) return false;
    return !state.chasers.some((other) => {
      if (other.id == chaser.id) return false;
      const otherTarget = other.dir ? ahead(other.tile, other.dir) : other.tile;
      return tilesAreEqual(next, otherTarget);
    });
  });

  for (const player of state.players) {
    for (const dir of validDirections) {
      const target = ahead(chaser.tile, dir);
      const distance =
        Math.abs(player.tile.x - target.x) + Math.abs(player.tile.y - target.y);
      if (distance < bestDistance) {
        bestDir = dir;
        bestDistance = distance;
      }
    }
  }
  chaser.dir = bestDir;
};

const handlePlayerDeath = (player: Player, state: GameState) => {
  player.lives--;

  state.players.forEach((p) => {
    p.tile = p.spawn;
    p.dir = null;
    p.nextDir = null;
    p.step = 0;
  });
  state.chasers.forEach((c) => {
    c.tile = c.spawn;
    c.dir = null;
    c.step = 0;
  });
};

export const tick = (state: GameState) => {
  state.tick++;

  state.players.forEach((player) => {
    stepPlayer(player);

    if (state.pellets[player.tile.y][player.tile.x]) {
      player.score += MAZE[player.tile.y][player.tile.x] == "o" ? 50 : 10;
      state.pellets[player.tile.y][player.tile.x] = false;
    }
    if (
      state.chasers.some(
        (chaser) =>
          tilesAreEqual(player.tile, chaser.tile) ||
          (chaser.dir &&
            tilesAreEqual(player.tile, ahead(chaser.tile, chaser.dir))) ||
          (player.dir &&
            tilesAreEqual(ahead(player.tile, player.dir), chaser.tile)),
      )
    ) {
      handlePlayerDeath(player, state);
    }
  });
  state.chasers.forEach((chaser) => {
    if (chaser.step == 0) pickChaserDirection(chaser, state);
    stepChaser(chaser);
  });
  if (!state.pellets.flat().some((hasPellet) => hasPellet))
    state.status = "won";
  else if (
    state.players.some((player) => player.lives <= 0) ||
    state.timeRemaining <= 0
  )
    state.status = "lost";
  else if (state.tick % TICKS_PER_SECOND == 0) {
    state.timeRemaining--;
  }
};
