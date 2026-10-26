import { GameState } from "../../../shared/types/game-types";
import { prisma } from "../prisma";

const saveMatch = async (state: GameState) => {
  try {
    await prisma.match.create({
      data: {
        status: state.status,
        mazeSeed: state.mazeId,
        timeLimitSeconds: state.timeLimit,
        startedAt: new Date(state.startedAt!),
        endedAt: new Date(),
        winnerUserId: state.winnerId ? Number(state.winnerId) : null,
        participants: {
          create: state.players.map((p, index) => ({
            userId: Number(p.id),
            slot: index + 1,
            result:
              state.status === "abandoned"
                ? "ABANDONED"
                : !state.winnerId
                  ? "DRAW"
                  : state.winnerId === p.id
                    ? "WIN"
                    : "LOSS",
            score: p.score,
            pelletsEaten: p.pelletsEaten,
            fruitsEaten: p.fruitsEaten,
            ghostsEaten: p.ghostsEaten,
            livesRemaining: p.lives,
            joinedAt: new Date(p.joinedAt!),
          })),
        },
      },
    });
  } catch (e) {
    console.error("[GAME-SERVICE] Failed to save match history:", e);
  }
};

export default saveMatch;
