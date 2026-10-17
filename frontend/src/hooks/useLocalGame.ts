import {useRef, useEffect, useState} from "react";
import type { GameState, Direction } from "../../../shared/types/game-types";
import { createGame, tick, applyInput } from "../engine/engine";


const TICK_INTERVAL_MS = 1000 / 30;
export default function uselocalgame(playerId: string='player-id'){
    const stateRef = useRef<GameState>(createGame(playerId));
    const [,setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => { //funct deja existante en js execute une fonction en boucle
            //lire state
            const state = stateRef.current;
            
            if (state.status === 'playing'){
                tick(state);
            }
            setFrame((f) => f+1 );
        }, TICK_INTERVAL_MS)
        return () => clearInterval(interval);
    }, []);

    const sendInput = (dir: Direction) => {
        const state = stateRef.current;
        
        if(state.status !== 'playing') return;

        applyInput(state, playerId, dir); //change la prochaine direction
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