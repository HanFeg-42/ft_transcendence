// frontend/src/pages/Game/GamePage.tsx
import { useEffect } from 'react';
import MazeUI from '../game/gameUI/MazeUI';
import { useGameSocket } from '../hooks/useGameSocket';
import { useAuth } from '../context/AuthContext'; // ⚠️ Adapter le chemin

function GamePage() {
  const { user, token } = useAuth();
  
  // ⭐ URL avec token (pattern identique au chat)
  const WS_URL = user && token
    ? `wss://localhost/api/game/ws?token=${token}`
    : '';
  
  const { isConnected, gameState, sendPlayerInput } = useGameSocket(
    WS_URL,
    'game-1'
  );
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') sendPlayerInput('up');
      if (e.key === 'ArrowDown') sendPlayerInput('down');
      if (e.key === 'ArrowLeft') sendPlayerInput('left');
      if (e.key === 'ArrowRight') sendPlayerInput('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sendPlayerInput]);

  if (!isConnected) return <div>Connexion au serveur...</div>;
  if (!gameState) return <div>En attente du premier état...</div>;

  return <MazeUI state={gameState} />;
}

export default GamePage;