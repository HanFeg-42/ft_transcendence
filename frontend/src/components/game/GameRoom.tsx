import { useEffect, useState, type ReactNode } from "react";
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
import { getProfileById } from "../../services/userService";
import { useTranslation } from "react-i18next";

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
  intent,
  onError,
  onPlayAgain,
  onBackToMenu,
  joiningScreen,
}: {
  gameId: string;
  mazeId: string;
  timeLimit: number;
  difficulty: string;
  intent?: "create" | "join";
  onError: (message: string) => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  joiningScreen?: ReactNode;
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
    intent,
  );
  const { t } = useTranslation();
  const myId = String(user?.id);
  const opponent = state?.players.find((p) => p.id !== myId);
  const [opponentName, setOpponentName] = useState(t("online_game_opponent"));

  useEffect(() => {
    if (!opponent?.id || !token) return;
    const loadOpponentName = async () => {
      try {
        setOpponentName(
          (await getProfileById(token, Number(opponent.id))).username,
        );
      } catch {
        // profile couldn't be loaded: keep "Opponent" as the name
      }
    };
    loadOpponentName();
  }, [opponent?.id]);

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
    if (error && state?.status !== "finished") {
      onError(error);
    }
  }, [error]);

  useEffect(() => {
    if (gaveUp && state?.status !== "playing")
      onError(t("online_game_connect_failed"));
  }, [gaveUp]);

  if (!state && joiningScreen) return joiningScreen;

  if (!state)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-vt323 text-xl text-gray-300">
          {t("online_game_joining_room")} {gameId}
          <Dots />
        </p>
      </div>
    );

  if (state.status === "waiting")
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 font-vt323 text-pacova-pink text-xl">
        <p className="text-3xl text-pacova-green">
          ▼ {t("online_game_room")}{" "}
          <span className="text-pacova-pink">{gameId}</span> ▼
        </p>
        <div className="w-80 p-4 flex flex-col gap-2 bg-black/60 border-2 border-pacova-green rounded-xl">
          <p className="flex justify-between">
            <span className="text-pacova-green">
              {t("local_game_difficulty")}
            </span>
            <span className="uppercase">{state.difficulty}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">{t("local_game_map")}</span>
            <span className="uppercase">{state.mazeId}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">{t("local_game_time")}</span>
            <span>
              {state.timeRemaining / 60} {t("local_game_minutes")}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-pacova-green">
              {t("online_game_players")}
            </span>
            <span>{state.players.length}/2</span>
          </p>
        </div>
        {state.players.length === 2 ? (
          <p className="text-2xl text-pacova-green">
            {t("online_game_starting_in")}{" "}
            <Countdown seconds={START_DELAY_MS / 1000} />
          </p>
        ) : (
          <p className="text-gray-300">
            {t("online_game_waiting_player")}
            <Dots />
          </p>
        )}
        <PixelButton variant="danger-red" onClick={onBackToMenu}>
          {t("online_game_leave")}
        </PixelButton>
      </div>
    );

  const isOpponentAway = state.status === "playing" && !opponent?.connected;
  const won = state.winnerId === myId;
  const getName = (id: string) =>
    id === myId ? (user?.username ?? t("online_game_you")) : opponentName;

  const hudLabel = (id: string) =>
    id === myId ? (
      <span className="font-press-start text-xs text-pacova-green">
        {t("online_game_you")}
      </span>
    ) : (
      <span className="font-press-start text-xs text-pacova-pink">
        {t("online_game_opponent")}
      </span>
    );

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
          <span className="font-press-start text-xs text-pacova-green max-w-[120px]  truncate">
            {hudLabel(state.players[0].id)}
          </span>
          <HudPlayer player={state.players[0]} />
        </div>
        <div className={styles.rightBar}>
          <span className="font-press-start text-xs text-pacova-green max-w-[120px]  truncate">
            {hudLabel(state.players[1].id)}
          </span>
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
                  ? t("online_game_draw")
                  : won
                    ? t("online_game_you_won")
                    : t("online_game_you_lost")}
              </h1>
              <div className="flex gap-4 w-full">
                <Result
                  name={getName(state.players[0].id)}
                  score={state.players[0].score}
                  lives={state.players[0].lives}
                  win={state.players[0].id === state.winnerId}
                />
                <Result
                  name={getName(state.players[1].id)}
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
                  {t("online_game_play_again")}
                </PixelButton>
                <PixelButton
                  variant="danger-red"
                  size="md"
                  onClick={onBackToMenu}
                >
                  {t("online_game_back_to_menu")}
                </PixelButton>
              </div>
            </div>
          </div>
        )}
        {isOpponentAway && (
          <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
            <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
              <h1 className="font-press-start text-pacova-pink">
                {t("online_game_opponent_disconnected")}
              </h1>
              <p className="font-vt323 text-2xl text-white/70">
                {t("online_game_forfeit_in")}
              </p>
              <p className="font-press-start text-3xl text-pacova-green drop-shadow-glow-green">
                <Countdown seconds={FORFEIT_DELAY_MS / 1000} />s
              </p>
            </div>
          </div>
        )}
        {!isConnected && state.status === "playing" && (
          <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
            <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
              <h1 className="font-press-start text-xl text-pacova-pink">
                {t("online_game_connection_lost")}
              </h1>
              {gaveUp ? (
                <div className="flex gap-6">
                  <PixelButton
                    variant="outline-green"
                    size="md"
                    onClick={onPlayAgain}
                  >
                    {t("online_game_play_again")}
                  </PixelButton>
                  <PixelButton
                    variant="danger-red"
                    size="md"
                    onClick={onBackToMenu}
                  >
                    {t("online_game_back_to_menu")}
                  </PixelButton>
                </div>
              ) : (
                <p className="font-vt323 text-2xl text-white/70">
                  {t("online_game_reconnecting")}
                  <Dots />
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
