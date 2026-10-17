import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { GameEvents } from "../../../../shared/types/game-types";
import PixelButton from "../ui/PixelButton";

const Matchmaking = ({
  onMatch,
  onCancel,
}: {
  onMatch: (gameId: string) => void;
  onCancel: () => void;
}) => {
  const { token } = useAuth();
  const url = `wss://${window.location.host}/api/game/ws?token=${token}`;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(url);
    ws.onopen = () =>
      ws.send(JSON.stringify({ event: GameEvents.QUEUE, data: {} }));
    ws.onmessage = (msg: MessageEvent) => {
      const packet = JSON.parse(msg.data);
      if (packet.event === GameEvents.MATCH_FOUND) onMatch(packet.data.gameId);
    };
    return () => ws.close();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <p className="font-vt323 text-2xl text-pacova-pink">
        Searching for a player...
      </p>
      <PixelButton onClick={onCancel}>Cancel</PixelButton>
    </div>
  );
};

export default Matchmaking;
