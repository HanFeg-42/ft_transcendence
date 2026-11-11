import { GameState } from "../../../shared/types/game-types";
import { notify } from "../notify";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user:3004";

export const reportResult = async (state: GameState) => {
  for (const p of state.players) {
    const result = !state.winnerId
      ? "draw"
      : state.winnerId === p.id
        ? "win"
        : "loss";

    try {
      const response = await fetch(`${USER_SERVICE_URL}/achievements/update-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": p.id },
        body: JSON.stringify({
          result,
          fruitsEaten: p.fruitsEaten,
          ghostsEaten: p.ghostsEaten,
        }),
      });
      if (!response.ok) {
        console.error(
          `[GAME-SERVICE] User service rejected match result for player ${p.id}:`,
          response.status,
        );
        continue;
      }

      const playerId = Number(p.id);
      if (Number.isSafeInteger(playerId)) {
        void notify(playerId, "match_finished", { result: result.toUpperCase() });
      }
    } catch (e) {
      console.error(
        `[GAME-SERVICE] Failed to report match result for player ${p.id}:`,
        e,
      );
    }
  }
};