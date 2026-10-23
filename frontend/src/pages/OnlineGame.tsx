import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_MAZE_ID,
  DIFFICULTIES,
  MAZES,
} from "../../../shared/data/game-data";
import {
  DEFAULT_TIME_LIMIT,
  TIME_LIMITS,
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
  if (!gameRoom)
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
          <PixelButton
            onClick={() => {
              setError(null);
              setGameRoom(roomInput);
            }}
          >
            Join gameroom
          </PixelButton>
          <PixelButton
            onClick={() => {
              setError(null);
              setSearching(true);
            }}
          >
            Find a match
          </PixelButton>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {Object.keys(DIFFICULTIES).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {TIME_LIMITS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds / 60} min
              </option>
            ))}
          </select>
          <select
            value={mazeId}
            onChange={(e) => setMazeId(e.target.value)}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {Object.keys(MAZES).map((maze) => (
              <option key={maze} value={maze}>
                {maze}
              </option>
            ))}
          </select>
        </div>
      </ArenaBackground>
    );
  return (
    <ArenaBackground>
      <GameRoom
        gameId={gameRoom}
        onError={handleError}
        onBackToMenu={() => setGameRoom(null)}
        onPlayAgain={() => {
          setGameRoom(null);
          setSearching(true);
        }}
        mazeId={mazeId}
        timeLimit={timeLimit}
        difficulty={difficulty}
      />
    </ArenaBackground>
  );
};
export default OnlineGame;
