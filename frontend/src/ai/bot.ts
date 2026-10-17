import type {GameState, Direction} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import { directions, directionToNearestPellet } from './pathfinding';
import { threatsNear, escapeDirection, directionToEatableChaser } from './danger';



// returns the direction the bot should ask for,
export function chooseDirection(state: GameState, botId: string): Direction | null
{

    const bot = state.players.find(player => player.id === botId);
    if(!bot)
        return null;

    const threats = threatsNear(state, botId);
    if(threats.length > 0)
        return escapeDirection(state, botId, threats);   

    const eatGhosts = directionToEatableChaser(state, botId);
    if(eatGhosts)
        return eatGhosts;

    const pelletD = directionToNearestPellet(state, botId);
    if(pelletD)
        return pelletD;

    const maze = MAZES[state.mazeId];


    // New list with only the moves where the next square is NOT a wall
    const freeDirections = directions.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
    if(freeDirections.length === 0)
        return null;

    const randomPos = Math.floor(Math.random() * freeDirections.length);
    
    return freeDirections[randomPos];
}
