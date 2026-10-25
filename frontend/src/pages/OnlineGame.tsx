import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import GameSettings from "../components/game/GameSettings";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_MAZE_ID,
  DEFAULT_TIME_LIMIT,
} from "../../../shared/data/game-data";
import GameRoom from "../components/game/GameRoom";
import Matchmaking from "../components/game/Matchmaking";
import { useSearchParams } from "react-router-dom";

const OnlineGame = () => {
  const [searchParams] = useSearchParams();
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

  if (!gameRoom && searching) {
    return (
      <ArenaBackground>
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
      </ArenaBackground>
    );
  }

  if (!gameRoom && screen === "create") {
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {error && <Badge variant="red">{error}</Badge>}
          <Input
            placeholder="Enter room name"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="text-center"
          />
          <GameSettings
            difficulty={difficulty}
            timeLimit={timeLimit}
            mazeId={mazeId}
            onDifficultyChange={setDifficulty}
            onTimeLimitChange={setTimeLimit}
            onMazeIdChange={setMazeId}
          />
          <PixelButton
            onClick={() => {
              setError(null);
              setGameRoom(roomInput);
            }}
          >
            Create
          </PixelButton>
          <PixelButton onClick={() => setScreen("menu")}>
            Back to menu
          </PixelButton>
        </div>
      </ArenaBackground>
    );
  }
  if (!gameRoom && screen === "join") {
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Input
            label="Room name"
            error={error ?? undefined}
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
          />
          <PixelButton
            onClick={() => {
              setError(null);
              setGameRoom(roomInput);
            }}
          >
            Join
          </PixelButton>
          <PixelButton onClick={() => setScreen("menu")}>
            Back to menu
          </PixelButton>
        </div>
      </ArenaBackground>
    );
  }
  if (!gameRoom) {
    return (
      <ArenaBackground>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {error && <Badge variant="red">{error}</Badge>}
          <PixelButton
            onClick={() => {
              setError(null);
              setSearching(true);
            }}
          >
            Find an opponent
          </PixelButton>
          <PixelButton onClick={() => setScreen("create")}>
            Create a room
          </PixelButton>
          <PixelButton onClick={() => setScreen("join")}>
            Join a room
          </PixelButton>
        </div>
      </ArenaBackground>
    );
  }
  return (
    <ArenaBackground>
      <GameRoom
        gameId={gameRoom}
        onError={handleError}
        onBackToMenu={() => {
          setGameRoom(null);
          setScreen("menu");
        }}
        onPlayAgain={() => {
          setGameRoom(null);
          setSearching(true);
          setScreen("menu");
        }}
        mazeId={screen === "create" ? mazeId : DEFAULT_MAZE_ID}
        timeLimit={screen === "create" ? timeLimit : DEFAULT_TIME_LIMIT}
        difficulty={screen === "create" ? difficulty : DEFAULT_DIFFICULTY}
      />
    </ArenaBackground>
  );
};
export default OnlineGame;
