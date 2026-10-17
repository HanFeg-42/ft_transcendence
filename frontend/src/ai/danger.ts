import type {GameState, Direction, Chaser, Tile} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import { directions, directionToNearest } from './pathfinding';




const DANGER_RADIUS: number  = 3;


function manhattan(a: Tile, b: Tile): number
{
    const horizontalDiff = Math.abs(a.x - b.x);
    const verticalDiff = Math.abs(a.y - b.y);
  
    return horizontalDiff + verticalDiff;
}


function isDangerous(state: GameState, chaser: Chaser): boolean
{
    if(state.vulnerableTimer > 0 && !chaser.isEaten)
        return false;
    return true;
}


export function threatsNear(state: GameState, botId: string): Chaser[]
{
    const bot = state.players.find(player => player.id === botId);
    if(!bot)
        return [];

    const dangerChasers =  state.chasers.filter(chaser => (isDangerous(state, chaser) && 
            (manhattan(bot.tile, chaser.tile) <= DANGER_RADIUS)))

    return dangerChasers;
}


export function escapeDirection(state: GameState, botId: string, threats: Chaser[]): Direction | null
{
    const bot = state.players.find(player => player.id === botId);
    if(!bot)
        return null;

    const maze = MAZES[state.mazeId];

    const freeDirections = directions.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
    if(freeDirections.length === 0)
        return null;



    let bestScore = -Infinity;
    let bestDirection: Direction | null = null;


    for (const dir of freeDirections) {
        // Calculate the next tile the bot would land on
        const nextTile = ahead(bot.tile, dir);

        // For that next tile, calculate the Manhattan distance to every threat
        const distances = threats.map(threat => manhattan(nextTile, threat.tile));

        // Find the lowest (minimum) distance among those threats. 
        // This is our safety score for this direction.
        const score = Math.min(...distances);

        // If this score is higher than our current bestScore, update our tracking variables
        if (score > bestScore) {
            bestScore = score;
            bestDirection = dir;
        }
    }

    // 5. Return the safest direction found
    return bestDirection;   
}



export function directionToEatableChaser(state: GameState, botId: string): Direction | null
{
    if(state.vulnerableTimer <= 0) return null;
    

    return directionToNearest(state, botId, (tile) => {
        return state.chasers.some((chaser) => {
          const isOnTile = chaser.tile.x === tile.x && chaser.tile.y === tile.y;
          const isNotEaten = !chaser.isEaten;
        
          return isOnTile && isNotEaten;
        });
      });
}
