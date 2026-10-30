import { useEffect } from "react";
import Countdown from "../../components/game/Countdown";
import HudTop from "./HudTop";
import HudPlayer from "./HudPlayer";
import { RotDev } from "./RotateDevice";
import MobileControls from "./MobileControls";
import styles from "../../pages/Game/GamePage.module.css";
import { useAuth } from "../../context/AuthContext";
import { useGameSocket } from "../../hooks/useGameSocket";
import type { Direction } from "../../../../shared/types/game-types";
import PixelButton from "../ui/PixelButton";
import {
  START_DELAY_MS,
  FORFEIT_DELAY_MS,
} from "../../../../shared/data/game-data";
import MazeUI from "./MazeUI";
import Result from "./ResultCard";
import Dots from "./Dots";

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
      <div className="flex-1 flex items-center justify-center">
        <p className="font-vt323 text-xl text-gray-300">
          Joining room {gameId}
          <Dots />
        </p>
      </div>
    );
  if (state.status === "waiting")
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 font-vt323 text-pacova-pink text-xl">
        <p className="text-3xl text-pacova-green">
          ▼ ROOM <span className="text-pacova-pink">{gameId}</span> ▼
        </p>
        <div className="w-80 p-4 flex flex-col gap-2 bg-black/60 border-2 border-pacova-green rounded-xl">
          <p className="flex justify-between">
            <span className="text-pacova-green">DIFFICULTY</span>
            <span className="uppercase">{state.difficulty}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">MAP</span>
            <span className="uppercase">{state.mazeId}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">TIME</span>
            <span>{state.timeRemaining / 60} min</span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">PLAYERS</span>
            <span>{state.players.length}/2</span>
          </p>
        </div>
        {state.players.length === 2 ? (
          <p className="text-2xl text-pacova-green">
            Starting in <Countdown seconds={START_DELAY_MS / 1000} />
          </p>
        ) : (
          <p className="text-gray-300">
            Waiting for another player
            <Dots />
          </p>
        )}
        <PixelButton variant="danger-red" onClick={onBackToMenu}>
          Leave
        </PixelButton>
      </div>
    );
  const myId = String(user?.id);
  const opponent = state.players.find((p) => p.id !== myId);
  const isOpponentAway = state.status === "playing" && !opponent?.connected;
  const won = state.winnerId === myId;
  const titleColor = won
    ? "text-pacova-green drop-shadow-glow-green"
    : "text-pacova-pink drop-shadow-glow-pink";

  return (
    <>
      <RotDev />
      {state.status === "playing" && (
        <MobileControls onInput={sendPlayerInput} />
      )}
      <div className={styles.page}>
        <div className={styles.topBar}>
          <HudTop state={state} />
        </div>
        <div className={styles.leftBar}>
          <HudPlayer player={state.players[0]} />
        </div>
        <div className={styles.rightBar}>
          <HudPlayer player={state.players[1]} />
        </div>
        <div className={styles.mazeWrapper}>
          <MazeUI state={state} mazeId={state.mazeId} />
        </div>
        {state.status === "finished" && (
          <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
            <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
              <h1 className={`font-press-start text-3xl ${titleColor}`}>
                {state.winnerId === undefined
                  ? "Draw"
                  : won
                    ? "You won"
                    : "You lost"}
              </h1>
              <div className="flex gap-4 w-full">
                <Result
                  name={`player 1`} // a place holder that needs to be replaced by username later
                  score={state.players[0].score}
                  lives={state.players[0].lives}
                  win={state.players[0].id === state.winnerId}
                />
                <Result
                  name={`player 2`} // a place holder that needs to be replaced by username later
                  score={state.players[1].score}
                  lives={state.players[1].lives}
                  win={state.players[1].id === state.winnerId}
                />
              </div>

              <div className="flex gap-6">
                <PixelButton
                  variant="outline-green"
                  size="md"
                  onClick={onPlayAgain}
                >
                  Play Again
                </PixelButton>
                <PixelButton
                  variant="danger-red"
                  size="md"
                  onClick={onBackToMenu}
                >
                  Back To Menu
                </PixelButton>
              </div>
            </div>
          </div>
        )}
        {isOpponentAway && (
          <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
            <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
              <h1 className="font-press-start text-xl text-pacova-pink">
                Opponent disconnected
              </h1>
              <p className="font-vt323 text-2xl text-white/70">Forfeit in</p>
              <p className="font-press-start text-5xl text-pacova-green drop-shadow-glow-green">
                <Countdown seconds={FORFEIT_DELAY_MS / 1000} />s
              </p>
            </div>
          </div>
        )}
        {!isConnected && state.status === "playing" && (
          <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
            <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
              <h1 className="font-press-start text-xl text-pacova-pink">
                Connection lost
              </h1>
              {gaveUp ? (
                <div className="flex gap-6">
                  <PixelButton
                    variant="outline-green"
                    size="md"
                    onClick={onPlayAgain}
                  >
                    Play Again
                  </PixelButton>
                  <PixelButton
                    variant="danger-red"
                    size="md"
                    onClick={onBackToMenu}
                  >
                    Back To Menu
                  </PixelButton>
                </div>
              ) : (
                <p className="font-vt323 text-2xl text-white/70">
                  reconnecting...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GameRoom;
