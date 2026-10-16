import type {GameState, Direction, Tile} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'


export const directions: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];

function key(tile: Tile): string
{
    return `${tile.x},${tile.y}`;
}


// returns the direction that continues pellet,
export function directionToNearestPellet(state: GameState, botId: string): Direction | null
{

    const bot = state.players.find(player => player.id === botId);
    if(!bot)
        return null;
    const maze = MAZES[state.mazeId];


    

    const visited = new Set<string>();
    visited.add(key(bot.tile));
    const queue: { tile: Tile; firstDir: Direction }[] = [];


    directions.forEach(dir => {
        const neighbor = ahead(bot.tile, dir);
        if(!isWall(maze, neighbor))
        {
            visited.add(key(neighbor));
            queue.push({ tile: neighbor, firstDir: dir });
        }
    });

    while(queue.length > 0)
    {
        const item = queue.shift()!;

        // Check if pellet exists (y goes first)
        if(state.pellets[item.tile.y][item.tile.x])
            return item.firstDir;

        // Check 4 directions from the current item's tile
        directions.forEach(dir => {
            const neighbor = ahead(item.tile, dir);
            const neighborKey = key(neighbor);

            if (!isWall(maze, neighbor) && !visited.has(neighborKey)) {
                visited.add(neighborKey);
                queue.push({ tile: neighbor, firstDir: item.firstDir });
            }
        }); 

    }
    return null;
}



