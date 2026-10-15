import { useEffect } from 'react';
import type { Direction } from '../../../shared/types/game-types';

export function useKeyboard(onInput: (dir: Direction) => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            let dir: Direction | null = null;

            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'UP';
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'DOWN';
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'LEFT';
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'RIGHT';

            if (dir) {
                e.preventDefault();
                onInput(dir);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onInput]);
}