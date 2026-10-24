
import type {GameState, Direction} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import {directions, directionToNearestPellet} from './pathfinding'
import {
    threatsNear,
    escapeDirection,
    directionToEatableChaser
} from './danger'



export type BotDifficulty = "easy" | "normal" | "hard";

const DIFFICULTY = {
    easy:   { dangerRadius: 1, chaseSteps: 2 },
    normal: { dangerRadius: 2, chaseSteps: 4 },
    hard:   { dangerRadius: 3, chaseSteps: 8 },
} as const;



export function chooseDirection(
    state: GameState,
    botId: string,
    difficulty: BotDifficulty = "hard"
): Direction | null {
    const bot = state.players.find(player => player.id === botId);
    if (!bot)
        return null;

    const config = DIFFICULTY[difficulty];

    // 1. Escape only ghosts that are genuine nearby threats.
    const threats = threatsNear(state, botId, config.dangerRadius);

    if (threats.length > 0)
    {
        const escape = escapeDirection(state, botId, threats);
        if (escape)
            return escape;
    }

    // 2. Chase a vulnerable ghost only if it is close enough.
    const eatGhost = directionToEatableChaser(state, botId, config.chaseSteps);
    if (eatGhost)
        return eatGhost;

    // 3. Main objective: collect pellets.
    const pelletDirection = directionToNearestPellet(state, botId);
    if (pelletDirection)
        return pelletDirection;

    // 4. No safe pellet route: escape only nearby threats.
    if (threats.length > 0)
    {
        const escape = escapeDirection(state, botId, threats);
        if (escape)
            return escape;
    }

    // 5. Last resort: take a valid direction instead of getting stuck.
    const maze = MAZES[state.mazeId];

    const freeDirections = directions.filter(dir =>
        !isWall(maze, ahead(bot.tile, dir))
    );

    if (freeDirections.length === 0)
        return null;

    return freeDirections[Math.floor(Math.random() * freeDirections.length)];
}
