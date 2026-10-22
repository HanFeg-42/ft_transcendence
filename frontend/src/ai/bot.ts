
import type {GameState, Direction} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import {directions, directionToNearestPellet} from './pathfinding'
import {
    threatsNear,
    escapeDirection,
    directionToEatableChaser
} from './danger'
import {isDangerous} from './safety'

export function chooseDirection(
    state: GameState,
    botId: string
): Direction | null
{
    const bot = state.players.find(player => player.id === botId);
    if (!bot)
        return null;

    const nearestChaser = state.chasers.reduce((nearest, chaser) =>
    {
        const distance = Math.abs(bot.tile.x - chaser.tile.x)
            + Math.abs(bot.tile.y - chaser.tile.y);

        const nearestDistance = Math.abs(bot.tile.x - nearest.tile.x)
            + Math.abs(bot.tile.y - nearest.tile.y);

        return distance < nearestDistance ? chaser : nearest;
    }, state.chasers[0]);

    const chaserInfo = nearestChaser
        ? `${nearestChaser.id}@(${nearestChaser.tile.x},${nearestChaser.tile.y})`
        : 'none';

    const threats = threatsNear(state, botId);

    if (threats.length > 0)
    {
        const direction = escapeDirection(state, botId, threats);

        console.log(
            `[BOT FLEE] tile=(${bot.tile.x},${bot.tile.y})`,
            `dir=${direction}`,
            `nearestChaser=${chaserInfo}`,
            `threatCount=${threats.length}`,
            `power=${state.vulnerableTimer}`
        );

        return direction;
    }

    const eatGhosts = directionToEatableChaser(state, botId);

    if (eatGhosts)
    {
        console.log(
            `[BOT CHASE GHOST] tile=(${bot.tile.x},${bot.tile.y})`,
            `dir=${eatGhosts}`,
            `nearestChaser=${chaserInfo}`,
            `power=${state.vulnerableTimer}`
        );

        return eatGhosts;
    }

    const pelletD = directionToNearestPellet(state, botId);

    if (pelletD)
    {
        console.log(
            `[BOT PELLET] tile=(${bot.tile.x},${bot.tile.y})`,
            `dir=${pelletD}`,
            `nearestChaser=${chaserInfo}`,
            `power=${state.vulnerableTimer}`
        );

        return pelletD;
    }

    // No safe pellet was found. Try to move toward a safer area.
    const dangerousChasers = state.chasers.filter(chaser =>
        isDangerous(state, chaser)
    );

    if (dangerousChasers.length > 0)
    {
        const escapeD = escapeDirection(
            state,
            botId,
            dangerousChasers
        );

        if (escapeD)
        {
            console.log(
                `[BOT SAFE AREA] tile=(${bot.tile.x},${bot.tile.y})`,
                `dir=${escapeD}`,
                `nearestChaser=${chaserInfo}`,
                `threatCount=${dangerousChasers.length}`,
                `power=${state.vulnerableTimer}`
            );

            return escapeD;
        }
    }

    const maze = MAZES[state.mazeId];

    const freeDirections = directions.filter(dir =>
        !isWall(maze, ahead(bot.tile, dir))
    );

    if (freeDirections.length === 0)
    {
        console.log(`[BOT STUCK] tile=(${bot.tile.x},${bot.tile.y})`);
        return null;
    }

    const randomPos = Math.floor(Math.random() * freeDirections.length);
    const direction = freeDirections[randomPos];

    console.log(
        `[BOT RANDOM] tile=(${bot.tile.x},${bot.tile.y})`,
        `dir=${direction}`,
        `nearestChaser=${chaserInfo}`,
        `power=${state.vulnerableTimer}`
    );

    return direction;
}
