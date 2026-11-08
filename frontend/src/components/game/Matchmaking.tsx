import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  GameClientEvents,
  GameServerEvents,
} from "../../../../shared/types/game-types";
import PixelButton from "../ui/PixelButton";
import Dots from "./Dots";
import { useTranslation } from "react-i18next";

const Matchmaking = ({
  onMatch,
  onCancel,
  onError,
}: {
  onMatch: (gameId: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const url = `wss://${window.location.host}/api/game/ws?token=${token}`;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(url);
    ws.onopen = () =>
      ws.send(JSON.stringify({ event: GameClientEvents.QUEUE, data: {} }));
    ws.onmessage = (msg: MessageEvent) => {
      const packet = JSON.parse(msg.data);
      if (packet.event === GameServerEvents.MATCH_FOUND)
        onMatch(packet.data.gameId);
      if (packet.event === GameServerEvents.ERROR) onError(packet.data.message);
    };
    ws.onclose = () => onError(t("online_game_search_lost"));
    return () => {
      ws.onclose = null;
      ws.close();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4  items-center">
      <p className="font-vt323 text-3xl text-pacova-green">
        ▼ {t("online_game_finding_opponent")} ▼
      </p>
      <p className="font-vt323 text-xl text-gray-300">
        {t("online_game_searching_player")}
        <Dots />
      </p>
      <PixelButton variant="danger-red" onClick={onCancel}>
        {t("online_game_cancel")}
      </PixelButton>
    </div>
  );
};

export default Matchmaking;
