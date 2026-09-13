export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type GameStatus = "playing" | "won" | "lost";

export interface Tile{
  x: number;
  y: number;
}

export interface Player {
  id: number;
  spawn: Tile;
  tile: Tile;
  dir: Direction | null;
  nextDir: Direction | null;
  step: number;
  lives: number;
  score: number;
}
export interface Chaser {
  id: number;
  tile: Tile;
  dir: Direction | null;
  step: number;
}
export interface GameState {
  tick: number;
  status: GameStatus;
  players: Player[];
  chasers: Chaser[];
  pellets: boolean[][];
  timeRemaining: number;
}
