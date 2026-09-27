import { useAuth } from "../context/AuthContext";
import { useGameSocket } from "../hooks/useGameSocket";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";

import { useEffect, useRef } from "react";
import { WIDTH, HEIGHT } from "../engine/maze";
import type { Direction } from "../../../shared/types/game-types";
// import { ahead, TICKS_PER_TILE } from "../engine/movement";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import { draw } from "../utils/render";

const TILE_SIZE = 32;
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

const Countdown = ({ seconds }: { seconds: number }) => {
  const [remaining, setRemaining] = useState<number>(seconds);

  useEffect(() => {
    let secondsLeft = remaining;
    const interval = setInterval(() => {
      secondsLeft--;
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{remaining}</span>;
};

const GameRoom = ({
  gameId,
  onFullRoom,
}: {
  gameId: string;
  onFullRoom: (message: string) => void;
}) => {
  const { user, token } = useAuth();
  const url = `wss://${window.location.host}/api/game/ws?token=${token}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    gameState: state,
    // isConnected,
    isRoomFull,
    sendPlayerInput,
  } = useGameSocket(url, gameId, user?.username ?? "guest");

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
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !state) return;

    draw(ctx, state);
  }, [state]);
  useEffect(() => {
    if (isRoomFull) {
      onFullRoom("This room is full, try another one");
    }
  }, [isRoomFull]);
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
        {state.players.map((p, i) => (
          <p key={p.id}>Player {i + 1} joined</p>
        ))}
        {state.players.length === 2 ? (
          <p>
            Starting in <Countdown seconds={3} />
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
        <canvas
          ref={canvasRef}
          width={WIDTH * TILE_SIZE}
          height={HEIGHT * TILE_SIZE}
        />
        {state.status === "finished" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Badge variant={"yellow"}>
              {state.winnerId === undefined
                ? "Draw"
                : state.winnerId === String(user?.id)
                  ? "You won"
                  : "You lost!"}
            </Badge>
          </div>
        )}
        {isOpponentAway && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <Badge variant="yellow">
              {"Opponent disconnected, Forfeit in "}
              <Countdown seconds={15} />s
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

const GameWs = () => {
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [roomInput, setRoomInput] = useState<string>("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinError = (message: string) => {
    setGameRoom(null);
    setRoomInput("");
    setJoinError(message);
  };

  if (!gameRoom)
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {joinError && <Badge variant="red">{joinError}</Badge>}
          <Input
            placeholder="Enter room name"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="text-center"
          />
          <PixelButton onClick={() => setGameRoom(roomInput)}>
            Join gameroom
          </PixelButton>
        </div>
      </ArenaBackground>
    );
  return (
    <ArenaBackground>
      <GameRoom gameId={gameRoom} onFullRoom={handleJoinError} />
    </ArenaBackground>
  );
};
export default GameWs;
