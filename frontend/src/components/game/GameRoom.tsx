import { useEffect } from "react";
import Countdown from "../../components/game/Countdown";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useGameSocket } from "../../hooks/useGameSocket";
import "./MazeUI";
import type { Direction } from "../../../../shared/types/game-types";
import PixelButton from "../ui/PixelButton";
import {
  START_DELAY_MS,
  FORFEIT_DELAY_MS,
} from "../../../../shared/data/game-data";
import MazeUI from "./MazeUI";

const KEY_MAP: Record<string, Direction> = {
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT",
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
};

const GameRoom = ({
  gameId,
  mazeId,
  timeLimit,
  difficulty,
  onError,
  onPlayAgain,
  onBackToMenu,
}: {
  gameId: string;
  mazeId: string;
  timeLimit: number;
  difficulty: string;
  onError: (message: string) => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}) => {
  const { user, token } = useAuth();
  const url = `wss://${window.location.host}/api/game/ws?token=${token}`;
  const {
    gameState: state,
    isConnected,
    error,
    sendPlayerInput,
    gaveUp,
  } = useGameSocket(
    url,
    gameId,
    user?.username ?? "guest",
    mazeId,
    timeLimit,
    difficulty,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        sendPlayerInput(dir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (error && !state) {
      onError(error);
    }
  }, [error]);
  if (!state)
    return (
      <p className="font-vt323 text-2xl text-pacova-pink text-center mt-10">
        Joining the room {gameId}
      </p>
    );
  if (state.status === "waiting")
    return (
      <div className="flex flex-col items-center gap-3 font-vt323 text-pacova-pink text-xl mt-10">
        <p className="text-2xl">Room {gameId}</p>
        <p>Duration: {state.timeRemaining / 60} min</p>
        <p>Difficulty: {state.difficulty}</p>
        <p>Map: {state.mazeId}</p>
        {state.players.map((p, i) => (
          <p key={p.id}>Player {i + 1} joined</p>
        ))}
        {state.players.length === 2 ? (
          <p>
            Starting in <Countdown seconds={START_DELAY_MS / 1000} />
          </p>
        ) : (
          <p>Waiting for another player...</p>
        )}
      </div>
    );
  const myId = String(user?.id);
  const opponent = state.players.find((p) => p.id !== myId);
  const isOpponentAway = state.status === "playing" && !opponent?.connected;

  return (
    <div className="flex-1 flex-col flex items-center justify-center gap-4">
      <div className="flex gap-4 w-152 justify-between">
        <Badge variant="yellow">timeRemaining: {state.timeRemaining} </Badge>
        {state.players.map((p, index) => (
          <Badge variant="green">
            Player{index + 1} score: {p.score} lives: {p.lives}
          </Badge>
        ))}
      </div>
      <div className="relative">
        <MazeUI state={state} mazeId={state.mazeId} />
        {state.status === "finished" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Badge variant={"yellow"}>
              {state.winnerId === undefined
                ? "Draw"
                : state.winnerId === String(user?.id)
                  ? "You won"
                  : "You lost!"}
            </Badge>
            <PixelButton onClick={onPlayAgain}>Play again</PixelButton>
            <PixelButton onClick={onBackToMenu}>Back to menu</PixelButton>
          </div>
        )}
        {isOpponentAway && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Badge variant="yellow">
              {"Opponent disconnected, Forfeit in "}
              <Countdown seconds={FORFEIT_DELAY_MS / 1000} />s
            </Badge>
          </div>
        )}
        {!isConnected && state.status === "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Badge variant="yellow">
              {gaveUp ? "Connection lost" : "Connection lost, reconnecting..."}
            </Badge>
            {gaveUp && (
              <>
                <PixelButton onClick={onPlayAgain}>Play again</PixelButton>
                <PixelButton onClick={onBackToMenu}>Back to menu</PixelButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
