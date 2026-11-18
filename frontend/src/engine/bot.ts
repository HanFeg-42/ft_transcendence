import type {
  GameState,
  Direction,
  Tile,
  Player,
} from "../../../shared/types/game-types";
import { applyInput, tick } from "../engine/engine";
import { isWall } from "../engine/maze";
import { MAZES, TICKS_PER_TILE } from "../../../shared/data/game-data";
import { ahead } from "../engine/movement";

export type BotDifficulty = "easy" | "normal" | "hard";


// depth   = how many tiles ahead the bot looks
// mistake = chance of picking a worse (but safe) move instead of the best one
const LEVELS = {
  easy: { depth: 2, mistake: 0.3 },
  normal: { depth: 4, mistake: 0.15 },
  hard: { depth: 6, mistake: 0.05 },
};

const DIRS: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
const BACK: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

// Score of a move where the bot dies (always the worst value)
const DEATH = -10000;


// Copy of the game used to "imagine" a move without touching the real game.
// Only the bot is kept as a player; ghosts and pellets are copied too.
const simulateState = (state: GameState, id: string): GameState => ({
  ...state,
  players: state.players.filter((p) => p.id === id).map((p) => ({ ...p })),
  chasers: state.chasers.map((c) => ({ ...c })),
  pellets: state.pellets.map((row) => [...row]),
});

// Tile -> "x,y" string, used as a key in the visited set
function key(tile: Tile): string {
  return `${tile.x},${tile.y}`;
}


// Distance (in tiles) from a tile to the nearest pellet, using BFS:
// explore the maze ring by ring, the first pellet found gives the distance.
const pelletDistance = (state: GameState, from: Tile): number => {
  const maze = MAZES[state.mazeId];
  const seen = new Set<string>(); // tiles already visited
  seen.add(key(from));

  let layer = [from]; // current ring of tiles
  let d = 0; // distance of the current ring

  while (layer.length !== 0) {
    const next: Tile[] = [];
    for (const t of layer) {
      if (state.pellets[t.y][t.x]) return d;

      for (const dir of DIRS) {
        const neighbor = ahead(t, dir);
        const neighborKey = key(neighbor);

        if (!isWall(maze, neighbor) && !seen.has(neighborKey)) {
          seen.add(neighborKey);
          next.push(neighbor);
        }
      }
    }
    layer = next;
    d++;
  }
  return 0;
};


// Core of the bot: tries every possible move, looks `depth` tiles ahead,
// and returns all moves sorted from best to worst.
// `back` is the direction we came from (not reused, so the bot doesn't go back and forth).
function rank(
  state: GameState,
  bot: Player,
  depth: number,
  back?: Direction,
): { dir: Direction; value: number }[] {
  const maze = MAZES[state.mazeId];

  // Only the moves where the next tile is not a wall
  const freeDirections = DIRS.filter(
    (dir) => !isWall(maze, ahead(bot.tile, dir)),
  );
  if (freeDirections.length === 0) return [];

  // Avoid turning back, unless it is the only way
  const dirs = freeDirections.filter((d) => d !== back);
  const options = dirs.length ? dirs : freeDirections;

  return options
    .map((dir) => {
      const newState = simulateState(state, bot.id); // the imaginary game
      const me = newState.players[0]; // the bot inside the copy
      const { lives, score } = me;

      applyInput(newState, bot.id, dir); // press the key in the copy

      // Play one full tile of movement, stop early if the bot dies
      for (let i = 0; i < TICKS_PER_TILE && me.lives === lives; i++)
        tick(newState);

      if (me.lives < lives) return { dir, value: DEATH };

      // Points earned during this move
      const gained = me.score - score;

      // Game is over in the copy (won or lost): no need to look further
      if (newState.status !== "playing")
        return { dir, value: gained };

      // Future value: keep searching deeper, or at the last level
      // prefer positions close to a pellet (closer = higher value)
      let futureValue = 0;
      if (depth > 1)
        futureValue = rank(newState, me, depth - 1, BACK[dir])[0]?.value ?? 0;
      else futureValue = -3 * pelletDistance(newState, me.tile);

      // The future counts a bit less (0.9) than what we gain right now
      return { dir, value: gained + 0.9 * futureValue };
    })
    .sort((a, b) => b.value - a.value);
}


// Called by the game loop: returns the direction the bot should take
// (or null if the bot is not at the center of a tile yet).
export function chooseDirection(
  state: GameState,
  botId: string,
  level: BotDifficulty = "hard",
): Direction | null {
  const bot = state.players.find((p) => p.id === botId);

  // The bot only decides when it is exactly on a tile (not between two tiles)
  if (!bot || bot.step !== 0) return null;

  const { depth, mistake } = LEVELS[level];
  let moves = rank(state, bot, depth, bot.dir ? BACK[bot.dir] : undefined);

  // The best move without turning back is deadly: search again allowing any direction
  if (moves[0].value <= DEATH / 2)
    moves = rank(state, bot, depth);

  const [best, ...others] = moves;
  const safe = others.filter((m) => m.value > DEATH / 2); // worse moves, but survivable

  // Sometimes pick a random safe move instead of the best one (makes easy levels beatable)
  const choice =
    Math.random() < mistake && safe.length
      ? safe[Math.floor(Math.random() * safe.length)]
      : best;

  return choice?.dir ?? null;
}