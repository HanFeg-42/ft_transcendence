import { useEffect } from 'react';
import type { Direction } from '../../../shared/types/game-types';

type KeyScheme = 'arrows' | 'wasd';

export function useKeyboard(
    onInput: (dir: Direction) => void,
    scheme: KeyScheme = 'arrows'
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            let dir: Direction | null = null;

            if (scheme === 'arrows') {
                if (e.key === 'ArrowUp')    dir = 'UP';
                if (e.key === 'ArrowDown')  dir = 'DOWN';
                if (e.key === 'ArrowLeft')  dir = 'LEFT';
                if (e.key === 'ArrowRight') dir = 'RIGHT';
            } else {
                if (e.key === 'w' || e.key === 'W') dir = 'UP';
                if (e.key === 's' || e.key === 'S') dir = 'DOWN';
                if (e.key === 'a' || e.key === 'A') dir = 'LEFT';
                if (e.key === 'd' || e.key === 'D') dir = 'RIGHT';
            }

            if (dir) {
                e.preventDefault();
                onInput(dir);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onInput, scheme]);
}