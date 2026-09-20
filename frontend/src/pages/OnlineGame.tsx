import { useAuth } from "../context/AuthContext";
import { useGameSocket } from "../hooks/useGameSocket";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";

// const TEST_TOKEN =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc4OTg2MTAzNiwiZXhwIjoxNzg5ODY0NjM2fQ.6dh0QOHILRk2dOSqwD78tSkh89TUlhGcI1liKUlV7qA";

import { useEffect, useRef } from "react";
import { MAZE, WIDTH, HEIGHT } from "../../../shared/engine/maze";
import type {
  GameState,
  Direction,
  Tile,
} from "../../../shared/types/game-types";
import { ahead, TICKS_PER_TILE } from "../../../shared/engine/movement";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";

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

const getDrawPosition = (
  tile: Tile,
  dir: Direction | null,
  step: number,
): Tile => {
  if (!dir) return { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE };
  const target = ahead(tile, dir);
  const progress = step / TICKS_PER_TILE;

  return {
    x: (tile.x + (target.x - tile.x) * progress) * TILE_SIZE,
    y: (tile.y + (target.y - tile.y) * progress) * TILE_SIZE,
  };
};
const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, TILE_SIZE * WIDTH, TILE_SIZE * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (MAZE[y][x] == "#") {
        ctx.fillStyle = "purple";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (state.pellets[y][x]) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(
          x * TILE_SIZE + TILE_SIZE / 3,
          y * TILE_SIZE + TILE_SIZE / 3,
          TILE_SIZE / 3,
          TILE_SIZE / 3,
        );
      }
    }
  }
  ctx.fillStyle = "red";
  state.chasers.forEach((chaser) => {
    const pos = getDrawPosition(chaser.tile, chaser.dir, chaser.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
  ctx.fillStyle = "blue";
  state.players.forEach((player) => {
    const pos = getDrawPosition(player.tile, player.dir, player.step);
    ctx.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
  });
};

const GameRoom = ({ gameId }: { gameId: string }) => {
  const { user, token } = useAuth();
  const url = `wss://${window.location.host}/api/game/ws?token=${token}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    gameState: state,
    // isConnected,
    sendPlayerInput,
  } = useGameSocket(url, gameId, user?.username ?? "guest");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) sendPlayerInput(dir);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !state) return;

    draw(ctx, state);
  }, [state]);

  if (!state) return <p>Joined the room {gameId}</p>;
  return (
    <ArenaBackground>
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
          {state.status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              <Badge variant={state.status === "won" ? "green" : "red"}>
                {state.status === "won" ? "You Win!" : "Game Over"}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
};

const OnlineGame = () => {
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [roomInput, setRoomInput] = useState<string>("");

  if (!gameRoom)
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
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
  return <GameRoom gameId={gameRoom} />;
};
export default OnlineGame;
