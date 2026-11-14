import { useRef, useEffect, useState, useCallback } from "react";
import type {  GameState,  Direction,  Player,} from "../../../shared/types/game-types";
import { createGame, tick, applyInput } from "../engine/engine";
import { TICKS_PER_SECOND } from "../../../shared/data/game-data";
import {  DEFAULT_TIME_LIMIT,  DEFAULT_MAZE_ID,  DEFAULT_DIFFICULTY,} from "../../../shared/data/game-data";

const TICK_INTERVAL_MS = 1000 / TICKS_PER_SECOND;
export function useLocalGame(
  playerId: string = "player-1",
  playersCount: number = 1,
  timeLimit: number = DEFAULT_TIME_LIMIT,
  mazeId: string = DEFAULT_MAZE_ID,
  difficulty: string = DEFAULT_DIFFICULTY,
) {
  const stateRef = useRef<GameState>(
    createGame(playerId, timeLimit, mazeId, difficulty),
  );
  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const togglePause = useCallback(() => {
    if (stateRef.current.status !== "playing") return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  useEffect(() => {
    const state = stateRef.current;

    if (playersCount === 2 && state.players.length === 1) {
      const spawn = state.players[0].spawn;
      const player2: Player = {
        id: "player-2",
        spawn: { x: spawn.x + 4, y: spawn.y },
        tile: { x: spawn.x + 4, y: spawn.y },
        dir: null,
        nextDir: null,
        step: 0,
        lives: 3,
        score: 0,
        connected: true,
        pelletsEaten: 0,
        fruitsEaten: 0,
        ghostsEaten: 0,
      };
      state.players.push(player2);
      setFrame((f) => f + 1);
    }
  }, [playersCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = stateRef.current;

      if (state.status === "playing" && !pausedRef.current) {
        tick(state);
      }
      setFrame((f) => f + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const sendInput = (id: string, dir: Direction) => {
    const state = stateRef.current;
    if (state.status !== "playing" || pausedRef.current) return;
    applyInput(state, id, dir);
  };
  return {
    state: stateRef.current,
    sendInput,
    paused,
    togglePause,
  };
}