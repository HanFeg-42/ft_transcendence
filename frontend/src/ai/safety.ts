
import type {GameState, Chaser, Tile} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {TICKS_PER_TILE} from '../engine/movement'
import {distanceMap} from './distance'

export const POWER_SAFETY_TILES = 4;
export const POWER_SAFETY_TICKS = POWER_SAFETY_TILES * TICKS_PER_TILE;
export const SAFE_MARGIN = 2;
export const MIN_ESCAPE_AREA = 12;

export function isDangerous(state: GameState, chaser: Chaser): boolean
{
    if (chaser.isEaten)
        return true;

    return state.vulnerableTimer <= POWER_SAFETY_TICKS;
}

export function ghostArrivalMap(state: GameState): number[][]
{
    const maze = MAZES[state.mazeId];
    const height = maze.length;
    const width = maze[0]?.length ?? 0;

    const ghostArrival = Array.from(
        { length: height },
        () => Array(width).fill(Infinity)
    );

    const dangerousChasers = state.chasers.filter(chaser =>
        isDangerous(state, chaser)
    );

    for (const chaser of dangerousChasers)
    {
        const ghostDistances = distanceMap(
            chaser.tile,
            width,
            height,
            (x, y) => isWall(maze, { x, y })
        );

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                ghostArrival[y][x] = Math.min(
                    ghostArrival[y][x],
                    ghostDistances[y][x]
                );
            }
        }
    }

    return ghostArrival;
}
