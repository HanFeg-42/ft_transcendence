import { GameState } from "../../shared/types/game-types";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user:3004";

export const reportResult = async (state: GameState) => {
  for (const p of state.players) {
    try {
      const response = await fetch(`${USER_SERVICE_URL}/profile/update-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": p.id },
        body: JSON.stringify({
          result: !state.winnerId
            ? "draw"
            : state.winnerId === p.id
              ? "win"
              : "loss",
        }),
      });
      if (!response.ok) {
        console.error(
          `[GAME-SERVICE] User service rejected match result for player ${p.id}:`,
          response.status,
        );
      }
    } catch (e) {
      console.error(
        `[GAME-SERVICE] Failed to report match result for player ${p.id}:`,
        e,
      );
    }
  }
};
