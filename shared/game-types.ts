// shared/game-types.ts
// Contract between: frontend (game UI) <-> game-service
// Field names/values below are PLACEHOLDERS - adjust to match
// however Pac-Man game logic.

// --- Event names -----------------------------------------------------
export const GameEvents = {
  JOIN_GAME: "joinGame",         // client -> server: join a match
  GAME_START: "gameStart",       // server -> client: match found, starting
  PLAYER_INPUT: "playerInput",   // client -> server: movement/direction
  GAME_STATE: "gameState",       // server -> client: authoritative state tick
  GAME_OVER: "gameOver",         // server -> client: match ended
} as const;

export type GameEvent = typeof GameEvents[keyof typeof GameEvents];

// --- Payload shapes ----------------------------------------------------
export interface JoinGamePayload {
  gameId: string;
  username: string;
}

export interface PlayerInputPayload {
  gameId: string;
  direction: "up" | "down" | "left" | "right";
}

// Adjust to your actual Pac-Man state: player positions, pellets, ghosts, score, etc.
export interface GameStatePayload {
  players: {
    id: string;
    username: string;
    x: number;
    y: number;
    score: number;
  }[];
  pellets: { x: number; y: number }[];
  tick: number;
}

export interface GameOverPayload {
  gameId: string;
  winnerId: string;
  finalScores: Record<string, number>;
}