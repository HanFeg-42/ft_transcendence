import type { GameState, Direction, Tile, Player } from "../../../shared/types/game-types";
import { applyInput, tick } from "../engine/engine";
import { MAZES, isWall } from "../engine/maze";
import { ahead, TICKS_PER_TILE } from "../engine/movement";




export type BotDifficulty = "easy" | "normal" | "hard";

const LEVELS = { 
    easy:   { depth: 2, mistake: 0.3  }, 
    normal: { depth: 4, mistake: 0.15 },
    hard:   { depth: 6, mistake: 0.05 },
};


const DIRS: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
const DEATH = -10000;  //value of a move where the bot dies

// const copy = (s: GameState, id: string): GameState => ({
//   ...s,
//   players: s.players.filter((p) => p.id === id).map((p) => ({ ...p })),
//   chasers: s.chasers.map((c) => ({ ...c })),
//   pellets: s.pellets.map((row) => [...row]),
// });

//takes the state and the bot’s id, and returns a new GameState
const simulateState = (state: GameState, id: string): GameState => ({
    ...state,
    players: state.players.filter((p) => p.id === id).map((p) => ({...p})),
    chasers: state.chasers.map((c) => ({...c})),
    pellets: state.pellets.map((row) => [...row]),
});


function rank(
    state: GameState,
    bot: Player,
    depth: number, 
    back?: Direction
): { dir: Direction; value: number }[]{


    const maze = MAZES[state.mazeId];

    // New list with only the moves where the next square is NOT a wall
    const freeDirections = DIRS.filter(dir => !isWall(maze, ahead(bot.tile, dir)));
    if(freeDirections.length === 0) return [];

    //remove old direction
    const dirs = freeDirections.filter((d) => d !== back);
    const options = dirs.length ? dirs : freeDirections;
    
    return options.map((dir) => {
    
            
        const newState = simulateState(state, bot.id);  //the imaginary game.
        const me = newState.players[0]; //the bot inside the copy
        const { lives, score } = me;

        applyInput(newState, bot.id, dir); //press the key in the copy

        //condition stops the loop on a death
        for (let i = 0; i < TICKS_PER_TILE && me.lives === lives; i++)
            tick(newState);

        if(me.lives < lives) return { dir, value: DEATH };
        return { dir, value: me.score - score };
    });



}



export function chooseDirection(
  state: GameState,
  botId: string,
  level: BotDifficulty = "hard"
): Direction | null{

    const bot = state.players.find((p) => p.id === botId);
    if (!bot || bot.step !== 0)
        return null;

    const { depth } = LEVELS[level];
    const moves = rank(state, bot, depth);
 
    
    return moves[0]?.dir ?? null;
}






















