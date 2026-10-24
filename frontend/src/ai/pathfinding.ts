
import type {GameState, Direction, Tile} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import {distanceMap} from './distance'
import {ghostArrivalMap, SAFE_MARGIN, MIN_ESCAPE_AREA} from './safety'

export const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];

function oppositeDirection(dir: Direction): Direction
{
    switch (dir)
    {
        case "UP": return "DOWN";
        case "DOWN": return "UP";
        case "LEFT": return "RIGHT";
        case "RIGHT": return "LEFT";
    }
}

function key(tile: Tile): string
{
    return `${tile.x},${tile.y}`;
}

type PathResult = {
    direction: Direction;
    steps: number;
};

type CanEnter = (tile: Tile, steps: number) => boolean;
type IsValidTarget = (tile: Tile, steps: number) => boolean;

export function directionToNearestPellet(
    state: GameState,
    botId: string
): Direction | null
{
    const maze = MAZES[state.mazeId];
    const height = maze.length;
    const width = maze[0]?.length ?? 0;

    // Evaluate danger relative to this bot, not every player equally.
    const ghostArrival = ghostArrivalMap(state, botId);

    const canEnter: CanEnter = (tile, steps) =>
    {
        const arrival = ghostArrival[tile.y]?.[tile.x] ?? Infinity;
        return arrival - steps >= SAFE_MARGIN;
    };

    const isValidTarget: IsValidTarget = (pellet, steps) =>
    {
        const escapeDistances = distanceMap(
            pellet,
            width,
            height,
            (x, y) => isWall(maze, { x, y })
        );

        let safeArea = 0;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                const distance = escapeDistances[y][x];

                if (distance === Infinity)
                    continue;

                const ghostArrivalTime = ghostArrival[y][x];

                if (steps + distance + SAFE_MARGIN <= ghostArrivalTime)
                    safeArea++;
            }
        }

        return safeArea >= MIN_ESCAPE_AREA;
    };

    const result = directionToNearest(
        state,
        botId,
        tile => Boolean(state.pellets[tile.y]?.[tile.x]),
        true,
        canEnter,
        isValidTarget
    );

    return result ? result.direction : null;
}

export function directionToNearest(
    state: GameState,
    botId: string,
    isTarget: (tile: Tile) => boolean,
    allowReverse: boolean = true,
    canEnter?: CanEnter,
    isValidTarget?: IsValidTarget
): PathResult | null
{
    const bot = state.players.find(player => player.id === botId);
    if (!bot)
        return null;

    const maze = MAZES[state.mazeId];
    const visited = new Set<string>();
    visited.add(key(bot.tile));

    const queue: {
        tile: Tile;
        firstDir: Direction;
        steps: number;
    }[] = [];

    const forbiddenDir = !allowReverse && bot.dir !== null
        ? oppositeDirection(bot.dir)
        : null;

    directions.forEach(dir =>
    {
        if (dir === forbiddenDir)
            return;

        const neighbor = ahead(bot.tile, dir);

        if (isWall(maze, neighbor))
            return;

        if (canEnter && !canEnter(neighbor, 1))
            return;

        const neighborKey = key(neighbor);

        if (visited.has(neighborKey))
            return;

        visited.add(neighborKey);
        queue.push({
            tile: neighbor,
            firstDir: dir,
            steps: 1
        });
    });

    let head = 0;

    while (head < queue.length)
    {
        const item = queue[head++];

        if (
            isTarget(item.tile) &&
            (!isValidTarget || isValidTarget(item.tile, item.steps))
        ) {
            return {
                direction: item.firstDir,
                steps: item.steps
            };
        }

        directions.forEach(dir =>
        {
            const neighbor = ahead(item.tile, dir);
            const neighborKey = key(neighbor);
            const nextSteps = item.steps + 1;

            if (isWall(maze, neighbor) || visited.has(neighborKey))
                return;

            if (canEnter && !canEnter(neighbor, nextSteps))
                return;

            visited.add(neighborKey);
            queue.push({
                tile: neighbor,
                firstDir: item.firstDir,
                steps: nextSteps
            });
        });
    }

    return null;
}
