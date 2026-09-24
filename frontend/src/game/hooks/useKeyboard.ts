// // game/hooks/useKeyboard.ts
// import { useEffect } from 'react';
// import type { GameState, Direction } from '../types';
// import { applyInput } from '../game';

// export function useKeyboard(state: GameState, playerId: number) {
//     useEffect(() => {
//         const handleKeyDown = (e: KeyboardEvent) => {
//             let dir: Direction | null = null;

//             if (e.key === 'ArrowUp' || e.key === 'w') dir = 'UP';
//             if (e.key === 'ArrowDown' || e.key === 's') dir = 'DOWN';
//             if (e.key === 'ArrowLeft' || e.key === 'a') dir = 'LEFT';
//             if (e.key === 'ArrowRight' || e.key === 'd') dir = 'RIGHT';

//             if (dir) {
//                 e.preventDefault();
//                 applyInput(state, playerId, dir);
//             }
//         };

//         window.addEventListener('keydown', handleKeyDown);
//         return () => window.removeEventListener('keydown', handleKeyDown);
//     }, [state, playerId]);
// }