// shared/types/game-types.ts
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
//1.Data sent by the client when joining a match
export interface JoinGamePayload {
  gameId: string;
  username: string;
}

//2.Data sent when a player presses an arrow key
export interface PlayerInputPayload {
  gameId: string;
  direction: "up" | "down" | "left" | "right";
}

// Adjust to your actual Pac-Man state: player positions, pellets, ghosts, score, etc.
//3.Data sent repeatedly by the server (usually 20–60 times per second) containing the positions of Pac-Man, ghosts, score, and game ticks
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


//4.Data sent when the match finishes
export interface GameOverPayload {
  gameId: string;
  winnerId: string;
  finalScores: Record<string, number>;
}