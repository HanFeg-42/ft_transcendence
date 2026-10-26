import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";
import Background from "../components/ui/Background";
import Badge from "../components/ui/Badge";
import { DEFAULT_MAZE_ID, MAZES } from "../engine/maze";
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
  if (!gameRoom)
    return (
      <Background>
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
            value={mazeId}
            onChange={(e) => setMazeId(e.target.value)}
            className="font-pixelify uppercase text-xl bg-black/60 text-pacova-pink border border-pacova-pink/60 focus:border-pacova-pink px-3 py-2 rounded-md outline-none cursor-pointer"
          >
            {Object.keys(MAZES).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </Background>
    );
  return (
    <Background>
      <GameRoom
        gameId={gameRoom}
        onError={handleError}
        onBackToMenu={() => setGameRoom(null)}
        onPlayAgain={() => {
          setGameRoom(null);
          setSearching(true);
        }}
        mazeId={mazeId}
      />
    </Background>
  );
};
export default OnlineGame;
