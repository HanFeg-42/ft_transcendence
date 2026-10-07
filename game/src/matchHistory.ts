import { GameState } from "../../shared/types/game-types";
import { prisma } from "./prisma";

export const saveMatch = async (state: GameState, startedAt: Date) => {
  try {
    await prisma.match.create({
      data: {
        status: "finished",
        mazeSeed: state.mazeId,
        // TODO: timeLimitSeconds - save the real time limit instead of the default (360)
        startedAt,
        endedAt: new Date(),
        winnerUserId: state.winnerId ? Number(state.winnerId) : null,
        participants: {
          create: state.players.map((p, index) => ({
            userId: Number(p.id),
            slot: index + 1,
            result: !state.winnerId
              ? "draw"
              : state.winnerId === p.id
                ? "win"
                : "loss",
            score: p.score,
            livesRemaining: p.lives,
            // TODO: joinedAt - save the real join time instead of the default
          })),
        },
      },
    });
  } catch (e) {
    console.error("[GAME-SERVICE] Failed to save match history:", e);
  }
};
