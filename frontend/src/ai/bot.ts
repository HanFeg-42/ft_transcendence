import type {GameState, Direction} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import { directions } from './pathfinding';
import { threatsNear, escapeDirection, directionToEatableChaser, safeDirectionToPellet, isDangerous } from './danger';



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

    // const pelletD = directionToNearestPellet(state, botId);
    // if(pelletD)
    //     return pelletD;


    const safePellet = safeDirectionToPellet(state, botId);
if (safePellet) return safePellet;

// No pellet is safely reachable: keep away from every dangerous ghost
const allDanger = state.chasers.filter(c => isDangerous(state, c));
if (allDanger.length > 0) return escapeDirection(state, botId, allDanger);

    const maze = MAZES[state.mazeId];


    // New list with only the moves where the next square is NOT a wall
    const freeDirections = directions.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
    if(freeDirections.length === 0)
        return null;

    const randomPos = Math.floor(Math.random() * freeDirections.length);
    
    return freeDirections[randomPos];
}
