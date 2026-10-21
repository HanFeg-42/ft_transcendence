// import type {GameState, Direction, Chaser, Tile} from '../../../shared/types/game-types'
// import {MAZES, isWall} from '../engine/maze'
// import {ahead} from '../engine/movement'
// import { directions, directionToNearest } from './pathfinding';




// const DANGER_RADIUS: number  = 3;


// function manhattan(a: Tile, b: Tile): number
// {
//     const horizontalDiff = Math.abs(a.x - b.x);
//     const verticalDiff = Math.abs(a.y - b.y);
  
//     return horizontalDiff + verticalDiff;
// }


// function isDangerous(state: GameState, chaser: Chaser): boolean
// {
//     if(state.vulnerableTimer > 0 && !chaser.isEaten)
//         return false;
//     return true;
// }


// export function threatsNear(state: GameState, botId: string): Chaser[]
// {
//     const bot = state.players.find(player => player.id === botId);
//     if(!bot)
//         return [];

//     const dangerChasers =  state.chasers.filter(chaser => (isDangerous(state, chaser) && 
//             (manhattan(bot.tile, chaser.tile) <= DANGER_RADIUS)))

//     return dangerChasers;
// }


// export function escapeDirection(state: GameState, botId: string, threats: Chaser[]): Direction | null
// {
//     const bot = state.players.find(player => player.id === botId);
//     if(!bot)
//         return null;

//     const maze = MAZES[state.mazeId];

//     const freeDirections = directions.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
//     if(freeDirections.length === 0)
//         return null;



//     let bestScore = -Infinity;
//     let bestDirection: Direction | null = null;


//     for (const dir of freeDirections) {
//         // Calculate the next tile the bot would land on
//         const nextTile = ahead(bot.tile, dir);

//         // For that next tile, calculate the Manhattan distance to every threat
//         const distances = threats.map(threat => manhattan(nextTile, threat.tile));

//         // Find the lowest (minimum) distance among those threats. 
//         // This is our safety score for this direction.
//         const score = Math.min(...distances);

//         // If this score is higher than our current bestScore, update our tracking variables
//         if (score > bestScore) {
//             bestScore = score;
//             bestDirection = dir;
//         }
//     }

//     // 5. Return the safest direction found
//     return bestDirection;   
// }



// export function directionToEatableChaser(state: GameState, botId: string): Direction | null
// {
//     if(state.vulnerableTimer <= 0) return null;
    

//     return directionToNearest(state, botId, (tile) => {
//         return state.chasers.some((chaser) => {
//           const isOnTile = chaser.tile.x === tile.x && chaser.tile.y === tile.y;
//           const isNotEaten = !chaser.isEaten;
        
//           return isOnTile && isNotEaten;
//         });
//       });
// }






// src/ai/danger.ts
import type { GameState, Direction, Chaser } from '../../../shared/types/game-types'
import { MAZES, isWall } from '../engine/maze'
import { ahead } from '../engine/movement'
import { directions, directionToNearest } from './pathfinding'
import { distanceMap } from './distance'
console.log("NEW danger.ts is running");
export const stats = { threatsCalls: 0, threatsFound: 0, escapeCalls: 0 };

// const DANGER_RADIUS: number = 6;


const SAFETY_GAP = 2; // tune: 1 is risky, 3 is very cautious

export function isDangerous(state: GameState, chaser: Chaser): boolean {
    return !(state.vulnerableTimer > 0 && !chaser.isEaten);
}

export function safeDirectionToPellet(state: GameState, botId: string): Direction | null {
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return null;

    const maze = MAZES[state.mazeId];
    const width = maze[0].length;
    const height = maze.length;
    const blocked = (x: number, y: number) => isBlocked(state, x, y);

    // ghostArrival[y][x] = earliest turn any dangerous ghost can reach that tile
    const ghostArrival: number[][] = Array.from({ length: height }, () =>
        Array(width).fill(Infinity)
    );
    for (const c of state.chasers) {
        if (!isDangerous(state, c)) continue;
        const d = distanceMap(c.tile, width, height, blocked);
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++)
                if (d[y][x] < ghostArrival[y][x]) ghostArrival[y][x] = d[y][x];
    }

    const key = (x: number, y: number) => `${x},${y}`;
    const visited = new Set<string>([key(bot.tile.x, bot.tile.y)]);
    const queue: { x: number; y: number; d: number; first: Direction }[] = [];
    let head = 0;

    const tryPush = (x: number, y: number, d: number, first: Direction) => {
        if (isWall(maze, { x, y })) return;
        if (visited.has(key(x, y))) return;
        const g = ghostArrival[y]?.[x] ?? Infinity;
        if (g - d < SAFETY_GAP) return; // a ghost could get there too soon
        visited.add(key(x, y));
        queue.push({ x, y, d, first });
    };

    for (const dir of directions) {
        const n = ahead(bot.tile, dir);
        tryPush(n.x, n.y, 1, dir);
    }

    while (head < queue.length) {
        const cur = queue[head++];
        if (state.pellets[cur.y][cur.x]) return cur.first;
        for (const dir of directions) {
            const n = ahead({ x: cur.x, y: cur.y }, dir);
            tryPush(n.x, n.y, cur.d + 1, cur.first);
        }
    }
    return null; // no pellet reachable safely
}

function isBlocked(state: GameState, x: number, y: number): boolean {
    return isWall(MAZES[state.mazeId], { x, y });
}

export function threatsNear(state: GameState, botId: string): Chaser[] {
    const bot = state.players.find(p => p.id === botId);
    if (!bot) return [];

    const maze = MAZES[state.mazeId];
    const isBlocked = (x: number, y: number) => isWall(maze, { x, y });
stats.threatsCalls++;
    return state.chasers.filter(chaser => {
        if (state.vulnerableTimer > 0 && !chaser.isEaten) return false;
        const dist = distanceMap(chaser.tile, maze[0].length, maze.length, isBlocked);
        return dist[bot.tile.y][bot.tile.x] <= 3;
    });
}   
export function escapeDirection(state: GameState, botId: string, threats: Chaser[]): Direction | null {
    stats.escapeCalls++;
    const bot = state.players.find(player => player.id === botId);
    if (!bot) return null;

    const maze = MAZES[state.mazeId];
    const width = maze[0].length;
    const height = maze.length;

    // BFS from each threat
    const threatDists = threats.map(t =>
        distanceMap(t.tile, width, height, (x, y) => isBlocked(state, x, y))
    );

    const freeDirections = directions.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
    if (freeDirections.length === 0) return null;

    let bestScore = -Infinity;
    let bestDirection: Direction | null = null;

    for (const dir of freeDirections) {
        const nextTile = ahead(bot.tile, dir);

        // I arrive in 1 step. Ghost arrives in threatDists[i][nextTile] steps.
        let minMargin = Infinity;
        for (const td of threatDists) {
            const margin = td[nextTile.y][nextTile.x] - 1;
            if (margin < minMargin) minMargin = margin;
        }

        // margin <= 0 → ghost gets there first or same time → not safe
        if (minMargin <= 0) continue;
        if (minMargin > bestScore) {
            bestScore = minMargin;
            bestDirection = dir;
        }
    }

    // Fallback: if no safe tile, pick the least-bad one
    if (!bestDirection) {
        for (const dir of freeDirections) {
            const nextTile = ahead(bot.tile, dir);
            let minMargin = Infinity;
            for (const td of threatDists) {
                const margin = td[nextTile.y][nextTile.x] - 1;
                if (margin < minMargin) minMargin = margin;
            }
            if (minMargin > bestScore) {
                bestScore = minMargin;
                bestDirection = dir;
            }
        }
    }

    return bestDirection;
}

export function directionToEatableChaser(state: GameState, botId: string): Direction | null {
    if (state.vulnerableTimer <= 0) return null;

    const bot = state.players.find(player => player.id === botId);
    if (!bot) return null;

    const maze = MAZES[state.mazeId];
    const width = maze[0].length;
    const height = maze.length;

    // BFS from bot → gives real path distance to every tile
    const myDist = distanceMap(bot.tile, width, height, (x, y) => isBlocked(state, x, y));

    // Find the single nearest frightened ghost by path distance
    let target: Chaser | null = null;
    let nearest = Infinity;
    for (const chaser of state.chasers) {
        if (chaser.isEaten) continue;
        const d = myDist[chaser.tile.y][chaser.tile.x];
        if (d < nearest) {
            nearest = d;
            target = chaser;
        }
    }

    if (!target) return null;

    // Go toward that one specific ghost (stable target, no flipping)
    const tx = target.tile.x, ty = target.tile.y;
    return directionToNearest(state, botId, (tile) => tile.x === tx && tile.y === ty);
}   