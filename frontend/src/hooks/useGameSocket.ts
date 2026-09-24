// frontend/src/game/hooks/useGameSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameEvents,
  type GameStatePayload,
  type PlayerInputPayload,
} from '../../../shared/types/game-types';

export function useGameSocket(url: string, gameId: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameStatePayload | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[GAME-CLIENT] Connected');
      setIsConnected(true);
      ws.send(JSON.stringify({
        event: GameEvents.JOIN_GAME,
        data: { gameId, username: 'test' },
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      let packet;
      try {
        packet = JSON.parse(event.data);
      } catch {
        console.warn('[GAME-CLIENT] Invalid JSON');
        return;
      }

      if (packet.event === GameEvents.GAME_STATE) {
        // ⭐ ON STOCKE L'ÉTAT → React re-render MazeUI
        setGameState(packet.data);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => console.error('[GAME-CLIENT] Socket error');

    return () => ws.close();
  }, [url, gameId]);

  const sendPlayerInput = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      const payload: PlayerInputPayload = { gameId, direction };
      socketRef.current.send(JSON.stringify({
        event: GameEvents.PLAYER_INPUT,
        data: payload,
      }));
    },
    [gameId]
  );

  return { isConnected, gameState, sendPlayerInput };
}