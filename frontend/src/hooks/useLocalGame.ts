import { useRef, useEffect, useState } from "react";
import type {
  GameState,
  Direction,
  Player,
} from "../../../shared/types/game-types";
import { createGame, tick, applyInput } from "../engine/engine";
import { TICKS_PER_SECOND } from "../../../shared/data/game-data";

const TICK_INTERVAL_MS = 1000 / TICKS_PER_SECOND;
export function useLocalGame(
  playerId: string = "player-1",
  playersCount: number = 1,
) {
  const stateRef = useRef<GameState>(createGame(playerId));
  const [, setFrame] = useState(0);

  useEffect(() => {
    const state = stateRef.current;

    if (playersCount === 2 && state.players.length === 1) {
      const spawn = state.players[0].spawn;
      const player2: Player = {
        id: "player-2",
        spawn: { x: spawn.x + 4, y: spawn.y }, // Décalé de 4 cases
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
      //funct deja existante en js execute une fonction en boucle
      const state = stateRef.current;

      if (state.status === "playing") {
        tick(state);
      }
      setFrame((f) => f + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const sendInput = (id: string, dir: Direction) => {
    const state = stateRef.current;
    if (state.status !== "playing") return;
    applyInput(state, id, dir);
  };
  return {
    state: stateRef.current,
    sendInput,
  };
}

// import { useEffect, useRef, useState } from 'react';
// import type { GameState, Direction } from '../../../shared/types/game-types';
// import { createGame, tick, applyInput } from '../engine/engine';

// const TICK_INTERVAL_MS = 1000 / 30; // 30 ticks/seconde

// export function useLocalGame(playerId: string = 'player-1') {
//     // ⚠️ useRef car la logique MUTE le state directement
//     const stateRef = useRef<GameState>(createGame(playerId));
//     const [, setFrame] = useState(0);

//     useEffect(() => {
//         // addPlayer('player-2', stateRef.current);
//         //     setFrame(f => f + 1);
//         const interval = setInterval(() => {
//             tick(stateRef.current);   // Fait avancer la logique
//             setFrame((f) => f + 1);   // Force le re-render React
//         }, TICK_INTERVAL_MS);

//         return () => clearInterval(interval);
//     }, []);

//     // Fonction pour envoyer un input clavier
//     const sendInput = (dir: Direction) => {
//         applyInput(stateRef.current, playerId, dir);
//     };

//     return {
//         state: stateRef.current,
//         sendInput,
//     };
// }
