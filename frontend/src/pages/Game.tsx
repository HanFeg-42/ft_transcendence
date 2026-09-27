import { useEffect, useRef, useState } from "react";
import { WIDTH, HEIGHT } from "../engine/maze";
import { createGame, applyInput, tick } from "../engine/engine";
import type {
  GameState,
  Direction,
  GameStatus,
} from "../../../shared/types/game-types";
// import { ahead, TICKS_PER_TILE } from "../engine/movement";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import PixelButton from "../components/ui/PixelButton";
import { draw } from "../utils/render";
// import Badge from "../components/ui/Badge";

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

export default function Game() {
  const stateRef = useRef<GameState>(createGame("local"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number>(undefined);

  const startLoop = (ctx: CanvasRenderingContext2D) => {
    intervalRef.current = setInterval(() => {
      tick(stateRef.current);
      setHud({
        players: stateRef.current.players.map(({ score, lives }) => ({
          score,
          lives,
        })),
        timeRemaining: stateRef.current.timeRemaining,
        status: stateRef.current.status,
      });

      if (stateRef.current.status !== "playing")
        clearInterval(intervalRef.current);
      draw(ctx, stateRef.current);
    }, 1000 / 30);
  };

  const restart = () => {
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    stateRef.current = createGame("local");

    setHud({
      players: stateRef.current.players.map(({ score, lives }) => ({
        score,
        lives,
      })),
      timeRemaining: stateRef.current.timeRemaining,
      status: stateRef.current.status,
    });
    startLoop(ctx);
  };

  const [hud, setHud] = useState<{
    players: { score: number; lives: number }[];
    timeRemaining: number;
    status: GameStatus;
  }>({ players: [], timeRemaining: 360, status: "playing" });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        applyInput(stateRef.current, "local", dir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    setHud({
      players: stateRef.current.players.map(({ score, lives }) => ({
        score,
        lives,
      })),
      timeRemaining: stateRef.current.timeRemaining,
      status: stateRef.current.status,
    });
    startLoop(ctx);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(intervalRef.current);
    };
  }, []);
  return (
    <ArenaBackground>
      <div className="flex-1 flex-col flex items-center justify-center gap-4">
        <div className="flex gap-4 w-152 justify-between">
          <Badge variant="yellow">timeRemaining: {hud.timeRemaining} </Badge>
          {hud.players.map((p, index) => (
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
          {hud.status !== "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
              <Badge variant={hud.status === "won" ? "green" : "red"}>
                {hud.status === "won" ? "You Won!" : "You lost!"}
              </Badge>
              <PixelButton onClick={restart}>Restart</PixelButton>
            </div>
          )}
        </div>
      </div>
    </ArenaBackground>
  );
}
