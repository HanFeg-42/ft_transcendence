import { addPlayer, createGame, tick } from "./engine/engine";
import type { GameState } from "../../shared/types/game-types";

const sessions = new Map<string, GameState>();

export const joinSession = (gameId: string, playerId: string, mazeId?: string) => {
  if (!sessions.has(gameId)) {
    const state: GameState = createGame(playerId, 360,mazeId); // The player might be able to choose match duration later
    state.status = "waiting";
    sessions.set(gameId, state);
  } else addPlayer(playerId, sessions.get(gameId)!);
  return sessions.get(gameId)!;
};

export const getSession = (gameId: string) => {
  return sessions.get(gameId);
};

export const endSession = (gameId: string) => {
  sessions.delete(gameId);
};
