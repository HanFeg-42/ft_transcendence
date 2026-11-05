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

const OnlineGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gameRoom, setGameRoom] = useState<string | null>(
    searchParams.get("gameId"),
  );
  const [roomInput, setRoomInput] = useState<string>("");
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [timeLimit, setTimeLimit] = useState<number>(DEFAULT_TIME_LIMIT);
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [screen, setScreen] = useState<"menu" | "create" | "join">("menu");

  const handleError = (message: string) => {
    setGameRoom(null);
    setRoomInput("");
    setSearching(false);
    setError(message);
  };

  const changeScreen = (next: "menu" | "create" | "join") => {
    setError(null);
    setScreen(next);
  };

  if (!gameRoom && searching) {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Matchmaking
            onMatch={(gameId: string) => {
              setSearching(false);
              setGameRoom(gameId);
            }}
            onCancel={() => setSearching(false)}
            onError={handleError}
          />
        </div>
      </Background>
    );
  }

  if (!gameRoom && screen === "create") {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-vt323 text-3xl text-pacova-green">
            ▼ CREATE A ROOM ▼
          </p>
          {error && <Badge variant="red">{error}</Badge>}
          <div className="w-80">
            <Input
              placeholder="Enter room name"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="text-center"
            />
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
            <PixelButton
              variant="danger-red"
              onClick={() => changeScreen("menu")}
            >
              Back to menu
            </PixelButton>
            <PixelButton
              variant="filled-green"
              disabled={!roomInput}
              onClick={() => {
                setError(null);
                setGameRoom(roomInput);
              }}
            >
              Create
            </PixelButton>
          </div>
        </div>
      </Background>
    );
  }
  if (!gameRoom && screen === "join") {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-vt323 text-3xl text-pacova-green">
            ▼ JOIN A ROOM ▼
          </p>
          <div className="w-80">
            <Input
              placeholder="Enter room name"
              error={error ?? undefined}
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="text-center"
            />
          </div>
          <div className="flex gap-4 mt-2">
            <PixelButton
              variant="danger-red"
              onClick={() => changeScreen("menu")}
            >
              Back to menu
            </PixelButton>
            <PixelButton
              variant="filled-green"
              disabled={!roomInput}
              onClick={() => {
                setError(null);
                setGameRoom(roomInput);
              }}
            >
              Join
            </PixelButton>
          </div>
        </div>
      </Background>
    );
  }
  if (!gameRoom) {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="font-vt323 text-3xl text-pacova-green">
            ▼ PLAY ONLINE ▼
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
              Find an opponent
            </PixelButton>
            <PixelButton
              variant="outline-green"
              onClick={() => changeScreen("create")}
              className="w-full"
            >
              Create a room
            </PixelButton>
            <PixelButton
              variant="outline-green"
              onClick={() => changeScreen("join")}
              className="w-full"
            >
              Join a room
            </PixelButton>
            <div className="mt-4 flex justify-center">
              <PixelButton
                variant="danger-red"
                onClick={() => navigate("/home")}
              >
                Home
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
        onBackToMenu={() => {
          setGameRoom(null);
          changeScreen("menu");
        }}
        onPlayAgain={() => {
          setGameRoom(null);
          setSearching(true);
          changeScreen("menu");
        }}
        mazeId={screen === "create" ? mazeId : DEFAULT_MAZE_ID}
        timeLimit={screen === "create" ? timeLimit : DEFAULT_TIME_LIMIT}
        difficulty={screen === "create" ? difficulty : DEFAULT_DIFFICULTY}
      />
    </Background>
  );
};
export default OnlineGame;
