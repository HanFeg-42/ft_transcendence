import { useEffect, useRef, useState } from "react";
// Import shared WebSocket contract rules (event names and payload shapes)
import {
  GameClientEvents,
  GameServerEvents,
} from "../../../shared/types/game-types";
import type {
  PlayerInputPayload,
  Direction,
} from "../../../shared/types/game-types";
import type { GameState } from "../../../shared/types/game-types";

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 3;
const CONNECT_TIMEOUT_MS = 3000;

export function useGameSocket(
  url: string,
  gameId: string,
  username: string,
  mazeId?: string,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const gameOverRef = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false); //creates a tracked state variable re-render "Connected: ?" everytime calling setIsConnected(?)
  const [gaveUp, setGaveUp] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle messages from the backend
  function handleMessage(event: MessageEvent) {
    // Convert incoming message string into a usable JavaScript object
    let packet;
    try {
      packet = JSON.parse(event.data);
    } catch (err) {
      console.warn(
        "[GAME-CLIENT] Invalid JSON received, ignoring:",
        event.data,
      );
      return; // drop the bad message, keep the connection alive
    }
    // Check if incoming packet matches game state update
    if (packet.event === GameServerEvents.GAME_STATE) {
      setGameState(packet.data);
      if (packet.data.status === "finished") gameOverRef.current = true;
      // Render updated positions, score, pellets...
    }
    if (packet.event === GameServerEvents.ERROR) {
      setError(packet.data.message);
    }
  }

  // Handle disconnection
  function handleClose(event: CloseEvent) {
    console.log(`[GAME-CLIENT] Connection closed (Code: ${event.code})`);
  }

  // Handle socket errors
  function handleError() {
    console.error("[GAME-CLIENT] Socket error observed");
  }
  useEffect(() => {
    // 1. Establish connection to the backend server
    let stopped = false;
    let attempts = 0;
    let retryId: number | undefined;

    const connect = () => {
      const ws = new WebSocket(url);
      socketRef.current = ws;
      window.setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) ws.close();
      }, CONNECT_TIMEOUT_MS);

      // Open connection handler
      ws.onopen = () => {
        setIsConnected(true);
        ws.send(
          JSON.stringify({
            event: GameClientEvents.JOIN_GAME,
            data: { gameId, username, mazeId },
          }),
        );
      };

      // Listen for incoming messages from the backend
      ws.onmessage = (event: MessageEvent) => {
        attempts = 0;
        handleMessage(event);
      };

      // Listen for client disconnects
      ws.onclose = (event: CloseEvent) => {
        handleClose(event);
        setIsConnected(false);
        if (stopped || gameOverRef.current) return;
        if (attempts >= MAX_RECONNECT_ATTEMPTS || event.code === 4000) {
          setGaveUp(true);
          return;
        }
        attempts++;
        retryId = window.setTimeout(() => {
          connect();
        }, RECONNECT_DELAY_MS);
      };

      // Listen for socket errors
      ws.onerror = () => {
        handleError();
      };
    };
    connect();

    // Cleanup: Close socket connection when component unmounts
    return () => {
      socketRef.current?.close();
      clearTimeout(retryId);
      stopped = true;
    };
  }, [url]);

  // Send player movement input to the backend
  function sendPlayerInput(direction: Direction) {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[GAME-CLIENT] Cannot send input, socket not connected");
      return;
    }

    // 1. Create the payload matching PlayerInputPayload interface
    const payload: PlayerInputPayload = {
      gameId: gameId,
      direction: direction,
    };

    // 2. Wrap into envelope & convert to string:
    // Result sent over wire: '{"event":"playerInput","data":{"gameId":"game-1","direction":"up"}}'
    socketRef.current.send(
      JSON.stringify({
        event: GameClientEvents.PLAYER_INPUT,
        data: payload,
      }),
    );
  }

  return { isConnected, sendPlayerInput, gameState, error, gaveUp };
}
