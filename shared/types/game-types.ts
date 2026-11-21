// shared/types/game-types.ts
// Contract between: frontend (game UI) <-> game-service

// --- Event names -----------------------------------------------------
//A central list of every action that can happen over the WebSocket pipe
export const GameServerEvents = {
  GAME_STATE: "gameState", // server -> client: authoritative state tick
  MATCH_FOUND: "matchFound", // server -> client: opponent found, join this game
  ERROR: "error", // server -> client: bad payload
} as const;

export const GameClientEvents = {
  JOIN_GAME: "joinGame", // client -> server: join a match
  PLAYER_INPUT: "playerInput", // client -> server: movement/direction
  QUEUE: "queue", // client -> server: find me an opponent
  LEAVE_QUEUE: "leaveQueue", // client -> server: cancel the search
} as const;

// --- Payload shapes ----------------------------------------------------
//1.Data sent by the client when joining a match
export interface JoinGamePayload {
  gameId: string;
  username: string;
  mazeId?: string;
  timeLimit?: number;
  difficulty?: string;
  intent?: "create" | "join";
}
//2.Data sent when a player presses an arrow key
export interface PlayerInputPayload {
  gameId: string;
  direction: Direction;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type GameStatus =
  | "waiting"
  | "playing"
  | "won"
  | "lost"
  | "finished"
  | "abandoned";

export interface Tile {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  spawn: Tile;
  tile: Tile;
  dir: Direction | null;
  nextDir: Direction | null;
  step: number;
  lives: number;
  score: number;
  pelletsEaten: number;
  fruitsEaten: number;
  ghostsEaten: number;
  connected: boolean;
  joinedAt?: number;
}
export interface Chaser {
  id: number;
  spawn: Tile;
  tile: Tile;
  dir: Direction | null;
  step: number;
  isEaten: boolean;
}
export interface GameState {
  tick: number;
  status: GameStatus;
  players: Player[];
  chasers: Chaser[];
  pellets: boolean[][];
  fruits: boolean[][];
  timeRemaining: number;
  timeLimit?: number;
  startedAt?: number;
  winnerId?: string;
  vulnerableTimer: number;
  mazeId: string;
  difficulty: string;
}
