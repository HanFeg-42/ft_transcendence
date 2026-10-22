
import type {GameState, Direction, Chaser, Tile} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead, TICKS_PER_TILE} from '../engine/movement'
import {directions, directionToNearest} from './pathfinding'
import {distanceMap} from './distance'
import {
    isDangerous,
    ghostArrivalMap,
    POWER_SAFETY_TICKS,
    SAFE_MARGIN
} from './safety'

const DANGER_RADIUS: number = 3;

function manhattan(a: Tile, b: Tile): number
{
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export {isDangerous};

export function threatsNear(state: GameState, botId: string): Chaser[]
{
    const bot = state.players.find(player => player.id === botId);
    if (!bot)
        return [];

    return state.chasers.filter(chaser =>
        isDangerous(state, chaser) &&
        manhattan(bot.tile, chaser.tile) <= DANGER_RADIUS
    );
}

export function escapeDirection(
    state: GameState,
    botId: string,
    threats: Chaser[]
): Direction | null
{
    const bot = state.players.find(player => player.id === botId);
    if (!bot || threats.length === 0)
        return null;

    const maze = MAZES[state.mazeId];
    const height = maze.length;
    const width = maze[0]?.length ?? 0;

    if (width === 0 || height === 0)
        return null;

    const freeDirections = directions.filter(dir =>
        !isWall(maze, ahead(bot.tile, dir))
    );

    if (freeDirections.length === 0)
        return null;

    // Include all dangerous ghosts, even those outside DANGER_RADIUS.
    const ghostArrival = ghostArrivalMap(state);

    let bestDirection: Direction | null = null;
    let bestSafeArea = -1;
    let bestManhattanScore = -Infinity;

    for (const dir of freeDirections)
    {
        const nextTile = ahead(bot.tile, dir);

        const botDistances = distanceMap(
            nextTile,
            width,
            height,
            (x, y) => isWall(maze, { x, y })
        );

        let safeArea = 0;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                const botDistance = botDistances[y][x];
                const ghostDistance = ghostArrival[y][x];

                if (botDistance === Infinity)
                    continue;

                const botArrival = botDistance + 1;

                if (ghostDistance - botArrival >= SAFE_MARGIN)
                    safeArea++;
            }
        }

        const manhattanScore = Math.min(
            ...threats.map(threat =>
                manhattan(nextTile, threat.tile)
            )
        );

        if (
            safeArea > bestSafeArea ||
            (
                safeArea === bestSafeArea &&
                manhattanScore > bestManhattanScore
            )
        ) {
            bestSafeArea = safeArea;
            bestManhattanScore = manhattanScore;
            bestDirection = dir;
        }
    }

    return bestDirection;
}

export function directionToEatableChaser(
    state: GameState,
    botId: string
): Direction | null
{
    if (state.vulnerableTimer <= 0)
        return null;

    const targetChaser = (tile: Tile): boolean =>
    {
        return state.chasers.some(chaser =>
        {
            if (chaser.isEaten)
                return false;

            const targetTile = chaser.dir
                ? ahead(chaser.tile, chaser.dir)
                : chaser.tile;

            return tile.x === targetTile.x && tile.y === targetTile.y;
        });
    };

    let result = directionToNearest(
        state,
        botId,
        targetChaser,
        false
    );

    if (result === null)
    {
        result = directionToNearest(
            state,
            botId,
            targetChaser,
            true
        );
    }

    if (result === null)
        return null;

    const MAX_CHASE_STEPS = 8;
    const estimatedTicks = result.steps * TICKS_PER_TILE;

    if (result.steps > MAX_CHASE_STEPS)
        return null;

    if (estimatedTicks + POWER_SAFETY_TICKS >= state.vulnerableTimer)
        return null;

    return result.direction;
}
