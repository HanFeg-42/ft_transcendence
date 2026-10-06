// frontend/src/pages/GameTest/GameTestPage.tsx
import { useCallback } from 'react';
import MazeUI from '../../components/game/MazeUI';
import { useLocalGame } from '../../hooks/useLocalGame';
import { useKeyboard } from '../../hooks/useKeyboard';

function GameTestPage() {
    const { state, sendInput } = useLocalGame('player-1');

    // ⭐ useCallback pour éviter de recréer la fonction à chaque render
    const handleInput = useCallback(
        (dir: Parameters<typeof sendInput>[0]) => sendInput(dir),
        [sendInput]
    );
    useKeyboard(handleInput);

    return (
        <div style={{ padding: 40, background: '#000', minHeight: '100vh' }}>
            <h1 style={{ color: '#ff00ff', textAlign: 'center', fontFamily: 'monospace' }}>
                🎮 TEST UI — Pac-Man Local
            </h1>
            <MazeUI state={state} 
            mazeId="circuit"/>
            <div style={{
                color: '#fff',
                textAlign: 'center',
                marginTop: 20,
                fontFamily: 'monospace',
            }}>
                <p>Score : {state.players[0]?.score ?? 0}</p>
                <p>Vies : {state.players[0]?.lives ?? 0}</p>
                <p>Temps : {state.timeRemaining}s</p>
                <p>Status : {state.status}</p>
                <p>Utilise les flèches ↑↓←→ ou WASD</p>
            </div>
        </div>
    );
}

export default GameTestPage;