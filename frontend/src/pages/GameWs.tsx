import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";
import { useState } from "react";
import ArenaBackground from "../components/ui/ArenaBackground";
import Badge from "../components/ui/Badge";
import { DEFAULT_MAZE_ID, MAZES } from "../engine/maze";
import GameRoom from "../components/game/GameRoom";
import Matchmaking from "../components/game/Matchmaking";

const GameWs = () => {
  const [gameRoom, setGameRoom] = useState<string | null>(null);
  const [roomInput, setRoomInput] = useState<string>("");
  const [mazeId, setMazeId] = useState<string>(DEFAULT_MAZE_ID);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const handleJoinError = (message: string) => {
    setGameRoom(null);
    setRoomInput("");
    setJoinError(message);
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
          />
        </div>
      </ArenaBackground>
    );
  }
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
          <PixelButton onClick={() => setSearching(true)}>
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
      </ArenaBackground>
    );
  return (
    <ArenaBackground>
      <GameRoom
        gameId={gameRoom}
        onFullRoom={handleJoinError}
        mazeId={mazeId}
      />
    </ArenaBackground>
  );
};
export default GameWs;
