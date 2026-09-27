import { useEffect, useRef, useState } from 'react';
// Import shared WebSocket contract rules (event names and payload shapes)
import { GameEvents } from '../../../shared/types/game-types';
import type { PlayerInputPayload, Direction } from '../../../shared/types/game-types';
import type { GameState } from '../../../shared/types/game-types';




export function useGameSocket(url: string, gameId: string, username: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false); //creates a tracked state variable re-render "Connected: ?" everytime calling setIsConnected(?)
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // 1. Establish connection to the backend server
    const ws = new WebSocket(url);
    socketRef.current = ws;

    // Open connection handler
    ws.onopen = () => {
      console.log('[GAME-CLIENT] Connected to server');
      setIsConnected(true);
      ws.send(JSON.stringify({ event: GameEvents.JOIN_GAME, data: { gameId, username } }));

    };

    // Listen for incoming messages from the backend
    ws.onmessage = (event: MessageEvent) => {
      handleMessage(event);
    };

    // Listen for client disconnects
    ws.onclose = (event: CloseEvent) => {
      handleClose(event);
      setIsConnected(false);
    };

    // Listen for socket errors
    ws.onerror = () => {
      handleError();
    };

    // Cleanup: Close socket connection when component unmounts
    return () => {
      ws.close();
    };
  }, [url]);

  // Handle messages from the backend
  function handleMessage(event: MessageEvent) {
    // Convert incoming message string into a usable JavaScript object
    let packet
    try {
      packet = JSON.parse(event.data);
    } catch (err) {
      console.warn('[GAME-CLIENT] Invalid JSON received, ignoring:', event.data);
      return; // drop the bad message, keep the connection alive
    }

    // Check if incoming packet matches game state update
    if (packet.event === GameEvents.GAME_STATE) {
      console.log('[GAME-CLIENT] Game state update received:', packet.data);
      setGameState(packet.data);
      // Render updated positions, score, pellets...
    }
  }

  // Handle disconnection
  function handleClose(event: CloseEvent) {
    console.log(`[GAME-CLIENT] Connection closed (Code: ${event.code})`);
  }

  // Handle socket errors
  function handleError() {
    console.error('[GAME-CLIENT] Socket error observed');
  }




  // Send player movement input to the backend
  function sendPlayerInput(direction: Direction) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[GAME-CLIENT] Cannot send input, socket not connected');
      return;
    }

    // 1. Create the payload matching PlayerInputPayload interface
    const payload: PlayerInputPayload = {
      gameId: gameId,
      direction: direction
    };

    // 2. Wrap into envelope & convert to string:
    // Result sent over wire: '{"event":"playerInput","data":{"gameId":"game-1","direction":"up"}}'
    socketRef.current.send(
      JSON.stringify({
        event: GameEvents.PLAYER_INPUT,
        data: payload
      })
    );
  }

  return { isConnected, sendPlayerInput, gameState };
}