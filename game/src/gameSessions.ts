import { addPlayer, createGame, tick } from "./engine/engine";
import type { GameState } from "../../shared/types/game-types";

const sessions = new Map<string, GameState>();

export const joinSession = (gameId: string, playerId: number) => {
  if (!sessions.has(gameId)) sessions.set(gameId, createGame(playerId));
  else addPlayer(playerId, sessions.get(gameId)!);
  return sessions.get(gameId)!;
};

export const getSession = (gameId: string) => {
  return sessions.get(gameId);
};

export const endSession = (gameId: string) => {
    sessions.delete(gameId);
};
