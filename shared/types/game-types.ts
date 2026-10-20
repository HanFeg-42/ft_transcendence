// shared/types/game-types.ts
// Contract between: frontend (game UI) <-> game-service
// Field names/values below are PLACEHOLDERS - adjust to match
// however Pac-Man game logic.

// Every message sent across the WebSocket pipe uses a standard Envelope format:
// {
// "event": "<WHAT_HAPPENED>",//
// "data":  { "<THE_PAYLOAD_DETAILS>" }
// }

// --- Event names -----------------------------------------------------
//A central list of every action that can happen over the WebSocket pipe
export const GameServerEvents = {
  GAME_START: "gameStart", // server -> client: match found, starting
  GAME_STATE: "gameState", // server -> client: authoritative state tick
  GAME_OVER: "gameOver", // server -> client: match ended
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
}

//2.Data sent when a player presses an arrow key
export interface PlayerInputPayload {
  gameId: string;
  direction: Direction;
}

// Adjust to your actual Pac-Man state: player positions, pellets, ghosts, score, etc.
//3.Data sent repeatedly by the server (usually 20–60 times per second) containing the positions of Pac-Man, ghosts, score, and game ticks
// export interface GameStatePayload {
//   tick: number;
//   status: GameStatus;
//   players: Player[];
//   chasers: Chaser[];
//   pellets: boolean[][];
//   timeRemaining: number;
// }

export interface MatchFoundPayload {
  gameId: string;
}

//4.Data sent when the match finishes
export interface GameOverPayload {
  gameId: string;
  winnerId: string;
  finalScores: Record<string, number>;
}

export interface ErrorPayload {
  message: string;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type GameStatus = "waiting" | "playing" | "won" | "lost" | "finished";

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
  timeRemaining: number;
  timeLimit?: number;
  winnerId?: string;
  vulnerableTimer: number;
  mazeId: string;
}
