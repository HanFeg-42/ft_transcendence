import type {
  GameState,
  Player,
  Chaser,
  Tile,
  Direction,
} from "../../../shared/types/game-types";
import {
  TICKS_PER_SECOND,
  DEFAULT_MAZE_ID,
  MAZES,
  DIFFICULTIES,
} from "../../../shared/data/game-data";
import { findChaserSpawns, findSpawn, parseCollectibles, isWall } from "./maze";
import { stepPlayer, stepChaser, ahead } from "./movement";
import {
  TIME_LIMITS,
  DEFAULT_TIME_LIMIT,
  DEFAULT_DIFFICULTY,
} from "../../../shared/data/game-data";

const CENTER_OFFSET = 4;

export const addPlayer = (playerId: string, state: GameState) => {
  const maze = MAZES[state.mazeId];

  if (state.players.length >= 2 || state.players[0].id == playerId) return;

  const spawn: Tile = findSpawn(maze);
  state.players[0].spawn = { x: spawn.x - CENTER_OFFSET, y: spawn.y };
  state.players[0].tile = { x: spawn.x - CENTER_OFFSET, y: spawn.y };

  state.players.push({
    id: playerId,
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
};

export const removePlayer = (playerId: string, state: GameState) =>
  (state.players = state.players.filter((p) => p.id !== playerId));

export const createGame = (
  playerId: string,
  timeLimit: number = DEFAULT_TIME_LIMIT,
  mazeId: string = DEFAULT_MAZE_ID,
  difficulty: string = DEFAULT_DIFFICULTY,
): GameState => {
  if (!Object.keys(MAZES).includes(mazeId)) {
    console.warn(`[GAME] Unknown map "${mazeId}", using "${DEFAULT_MAZE_ID}"`);
    mazeId = DEFAULT_MAZE_ID;
  }
  if (!TIME_LIMITS.includes(timeLimit)) {
    console.warn(
      `[GAME] Invalid time limit "${timeLimit}", using ${DEFAULT_TIME_LIMIT}`,
    );
    timeLimit = DEFAULT_TIME_LIMIT;
  }
  if (!Object.keys(DIFFICULTIES).includes(difficulty)) {
    console.warn(
      `[GAME] Invalid difficulty "${difficulty}", using ${DEFAULT_DIFFICULTY}`,
    );
    difficulty = DEFAULT_DIFFICULTY;
  }

  const maze = MAZES[mazeId];

  const players: Player[] = [
    {
      id: playerId,
      spawn: findSpawn(maze),
      tile: findSpawn(maze),
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
    },
  ];

  const chasers: Chaser[] = findChaserSpawns(maze).map((tile, index) => {
    return {
      id: index,
      spawn: tile,
      tile,
      dir: null,
      step: 0,
      isEaten: false,
    };
  });
  return {
    tick: 0,
    status: "playing",
    players,
    chasers,
    pellets: parseCollectibles(maze, [".", "o"]),
    fruits: parseCollectibles(maze, ["F"]),
    timeRemaining: timeLimit,
    timeLimit,
    vulnerableTimer: 0,
    mazeId,
    difficulty,
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

const isTileFree = (state: GameState, target: Tile, chaser: Chaser) => {
  if (isWall(MAZES[state.mazeId], target)) return false;

  return !state.chasers.some((other) => {
    if (other.id == chaser.id) return false;
    if (tilesAreEqual(other.tile, target)) return true;
    const otherTarget = other.dir ? ahead(other.tile, other.dir) : null;

    return otherTarget && tilesAreEqual(target, otherTarget);
  });
};

const nearestPlayerDistance = (target: Tile, players: Player[]) => {
  return Math.min(
    ...players.map(
      (p) => Math.abs(p.tile.x - target.x) + Math.abs(p.tile.y - target.y),
    ),
  );
};

const pickChaserDirection = (chaser: Chaser, state: GameState) => {
  const isFrightened = state.vulnerableTimer && !chaser.isEaten;
  let bestDistance = isFrightened ? -Infinity : Infinity;
  let bestDir = null;

  const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
  const validDirections = directions.filter((dir) =>
    isTileFree(state, ahead(chaser.tile, dir), chaser),
  );

  for (const dir of validDirections) {
    const distance = nearestPlayerDistance(
      ahead(chaser.tile, dir),
      state.players,
    );
    if (isFrightened ? distance > bestDistance : distance < bestDistance) {
      bestDir = dir;
      bestDistance = distance;
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
  state.vulnerableTimer = 0;
};

const getWinnerId = (state: GameState) => {
  const [a, b] = state.players;
  if (b.lives <= 0 && a.lives > 0) return a.id;
  if (a.lives <= 0 && b.lives > 0) return b.id;
  return a.score > b.score ? a.id : b.score > a.score ? b.id : undefined;
};

export const finishMatch = (state: GameState, winnerId?: string) => {
  state.winnerId = winnerId;
  state.status = "finished";
};

export const tick = (state: GameState) => {
  const maze = MAZES[state.mazeId];

  state.tick++;
  state.players.forEach((player) => {
    stepPlayer(maze, player);

    if (state.pellets[player.tile.y][player.tile.x]) {
      const isPowerPellet = maze[player.tile.y][player.tile.x] === "o";
      player.score += isPowerPellet ? 50 : 10;
      player.pelletsEaten++;
      state.pellets[player.tile.y][player.tile.x] = false;
      if (isPowerPellet) {
        state.vulnerableTimer = 300;
        state.chasers.forEach((c) => (c.isEaten = false));
      }
    } else if (state.fruits[player.tile.y][player.tile.x]) {
      player.score += 100;
      player.fruitsEaten++;
      state.fruits[player.tile.y][player.tile.x] = false;
    }
    const touchedChaser = state.chasers.find(
      (chaser) =>
        tilesAreEqual(player.tile, chaser.tile) ||
        (chaser.dir &&
          tilesAreEqual(player.tile, ahead(chaser.tile, chaser.dir))) ||
        (player.dir &&
          tilesAreEqual(ahead(player.tile, player.dir), chaser.tile)),
    );
    if (touchedChaser) {
      if (state.vulnerableTimer && !touchedChaser.isEaten) {
        touchedChaser.isEaten = true;
        touchedChaser.dir = null;
        touchedChaser.tile = touchedChaser.spawn;
        touchedChaser.step = 0;
        player.score += 200;
        player.ghostsEaten++;
      } else handlePlayerDeath(player, state);
    }
  });
  state.chasers.forEach((chaser) => {
    if (chaser.step == 0) pickChaserDirection(chaser, state);
    stepChaser(chaser, DIFFICULTIES[state.difficulty!]);
  });
  if (!state.pellets.flat().some((hasPellet) => hasPellet)) {
    finishMatch(state, getWinnerId(state));
  } else if (
    state.players.some((player) => player.lives <= 0) ||
    state.timeRemaining <= 0
  )
    finishMatch(state, getWinnerId(state));
  else if (state.tick % TICKS_PER_SECOND == 0) {
    state.timeRemaining--;
  }
  if (state.vulnerableTimer) state.vulnerableTimer--;
};
