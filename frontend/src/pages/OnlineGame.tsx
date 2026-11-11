import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";
import Background from "../components/ui/Background";
import Badge from "../components/ui/Badge";
import GameSettings from "../components/game/GameSettings";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_MAZE_ID,
  DEFAULT_TIME_LIMIT,
} from "../../../shared/data/game-data";
import GameRoom from "../components/game/GameRoom";
import Matchmaking from "../components/game/Matchmaking";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const OnlineGame = () => {
  const [searchParams, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [gameRoom, setGameRoom] = useState<string | null>(
    searchParams.get("gameId"),
  );
  const { t } = useTranslation();
  const [roomInput, setRoomInput] = useState<string>("");
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [screen, setScreen] = useState<"menu" | "create" | "join">("menu");

  const handleError = (message: string) => {
    changeRoom(null);
    setSearching(false);
    setError(message);
  };

  const changeScreen = (next: "menu" | "create" | "join") => {
    setError(null);
    setScreen(next);
    setRoomInput("");
  };

  const changeRoom = (gameId: string | null) => {
    setGameRoom(gameId);
    setParams(gameId ? { gameId } : {}, { replace: true });
  };

  const backToMenu = () => {
    changeScreen("menu");
    changeRoom(null);
  };

  if (!gameRoom && searching) {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Matchmaking
            onMatch={(gameId: string) => {
              setSearching(false);
              changeRoom(gameId);
            }}
            onCancel={() => setSearching(false)}
            onError={handleError}
          />
        </div>
      </Background>
    );
  }

  let form;

  if (screen === "create") {
    form = (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="font-vt323 text-3xl text-pacova-green">
          ▼ {t("online_game_create_title")} ▼
        </p>
        <div className="w-80">
          <Input
            maxLength={20}
            placeholder={t("online_game_room_placeholder")}
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="text-center"
            disabled={gameRoom !== null}
          />
          <p className="h-6 text-center font-vt323 text-red-500 text-md">
            {error}
          </p>
        </div>
        <GameSettings
          difficulty={difficulty}
          timeLimit={timeLimit}
          mazeId={mazeId}
          onDifficultyChange={setDifficulty}
          onTimeLimitChange={setTimeLimit}
          onMazeIdChange={setMazeId}
        />
        <div className="flex gap-4 mt-2">
          <PixelButton variant="danger-red" onClick={backToMenu}>
            {t("online_game_back_to_menu")}
          </PixelButton>
          <PixelButton
            variant="filled-green"
            disabled={!roomInput.trim() || gameRoom !== null}
            onClick={() => {
              changeRoom(roomInput.trim());
            }}
          >
            {t("online_game_create")}
          </PixelButton>
        </div>
      </div>
    );
  }
  if (screen === "join") {
    form = (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="font-vt323 text-3xl text-pacova-green">
          ▼ {t("online_game_join_title")} ▼
        </p>
        <div className="w-80">
          <Input
            maxLength={20}
            placeholder={t("online_game_room_placeholder")}
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="text-center"
            disabled={gameRoom !== null}
          />
          <p className="h-6 text-center font-vt323 text-red-500 text-md">
            {error}
          </p>
        </div>
        <div className="flex gap-4 mt-2">
          <PixelButton variant="danger-red" onClick={backToMenu}>
            {t("online_game_back_to_menu")}
          </PixelButton>
          <PixelButton
            variant="filled-green"
            disabled={!roomInput.trim() || gameRoom !== null}
            onClick={() => {
              changeRoom(roomInput.trim());
            }}
          >
            {t("online_game_join")}
          </PixelButton>
        </div>
      </div>
    );
  }
  if (!gameRoom && form) return <Background>{form}</Background>;

  if (!gameRoom) {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-vt323 text-3xl text-pacova-green">
            ▼ {t("online_game_title")} ▼
          </p>
          {error && <Badge variant="red">{error}</Badge>}
          <div className="w-80 flex flex-col gap-4">
            <PixelButton
              variant="filled-green"
              onClick={() => {
                setError(null);
                setSearching(true);
              }}
              className="w-full"
            >
              {t("online_game_find_opponent")}
            </PixelButton>
            <PixelButton
              variant="outline-green"
              onClick={() => changeScreen("create")}
              className="w-full"
            >
              {t("online_game_create_room")}
            </PixelButton>
            <PixelButton
              variant="outline-green"
              onClick={() => changeScreen("join")}
              className="w-full"
            >
              {t("online_game_join_room")}
            </PixelButton>
            <div className="mt-4 flex justify-center">
              <PixelButton
                variant="danger-red"
                onClick={() => navigate("/home")}
              >
                {t("home")}
              </PixelButton>
            </div>
          </div>
        </div>
      </Background>
    );
  }
  return (
    <Background>
      <GameRoom
        gameId={gameRoom}
        onError={handleError}
        onBackToMenu={backToMenu}
        onPlayAgain={() => {
          changeRoom(null);
          setSearching(true);
          changeScreen("menu");
        }}
        mazeId={screen === "create" ? mazeId : DEFAULT_MAZE_ID}
        timeLimit={screen === "create" ? timeLimit : DEFAULT_TIME_LIMIT}
        difficulty={screen === "create" ? difficulty : DEFAULT_DIFFICULTY}
        intent={screen === "menu" ? undefined : screen}
        joiningScreen={form}
      />
    </Background>
  );
};
export default OnlineGame;
