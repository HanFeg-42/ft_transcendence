import type { GameState, Direction, Tile, Player } from "../../../shared/types/game-types";
import { applyInput, tick } from "./engine";
import { MAZES, isWall } from "./maze";
import { ahead, TICKS_PER_TILE } from "./movement";




export type BotDifficulty = "easy" | "normal" | "hard";

const LEVELS = { 
    easy:   { depth: 2, mistake: 0.3  }, 
    normal: { depth: 4, mistake: 0.15 },
    hard:   { depth: 6, mistake: 0.05 },
};


const DIRS: Direction[] = ["UP", "DOWN", "LEFT", "RIGHT"];
const BACK: Record<Direction, Direction> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
const DEATH = -10000;  //value of a move where the bot dies





//takes the state and the bot’s id, and returns a new GameState
const simulateState = (state: GameState, id: string): GameState => ({
    ...state,
    players: state.players.filter((p) => p.id === id).map((p) => ({...p})),
    chasers: state.chasers.map((c) => ({...c})),
    pellets: state.pellets.map((row) => [...row]),
});



function key(tile: Tile): string
{
    return `${tile.x},${tile.y}`;
}

const pelletDistance = (state: GameState, from: Tile): number =>
{
    const maze = MAZES[state.mazeId];
    const seen	= new Set<string>();    //Tiles already visited
    seen.add(key(from));

    let layer = [from];   //The current ring of tiles.
    let d = 0; //The distance of the current ring.


    while(layer.length !== 0)
    {
        const next: Tile[] = [];
        for (const t of layer) {
            if (state.pellets[t.y][t.x])
                return d;

            for (const dir of DIRS) {
                const neighbor = ahead(t, dir);
                const neighborKey = key(neighbor);

                if(!isWall(maze, neighbor) && !seen.has(neighborKey))
                {
                    seen.add(neighborKey);
                    next.push(neighbor);
                }
            }
            
        }
        layer = next;
        d++;
    }
    return 0;
}



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

        const gained = me.score - score;
        if(newState.status !== "playing")    //The game is over in the copy (won or lost)
            return { dir, value: gained }

        let futureValue = 0;
        if(depth > 1)
            futureValue = (rank(newState, me, depth - 1, BACK[dir])[0]?.value ?? 0);
        else 
            futureValue = -3 * pelletDistance(newState, me.tile);

        return { dir, value: gained + 0.9 * futureValue };
    })
    .sort((a, b) => b.value - a.value);


}



export function chooseDirection(
  state: GameState,
  botId: string,
  level: BotDifficulty = "hard"
): Direction | null{

    const bot = state.players.find((p) => p.id === botId);
    if (!bot || bot.step !== 0)
        return null;

    const { depth, mistake } = LEVELS[level];
    let moves = rank(state, bot, depth, bot.dir ? BACK[bot.dir] : undefined);
    
    if (moves[0].value <= DEATH / 2) //the best non-reverse move is deadly search again with no forbidden direction
        moves = rank(state, bot, depth);
    
    const [best, ...others] = moves;
    const safe = others.filter((m) => m.value > DEATH / 2); //the worse but survivable moves
    const choice = Math.random() < mistake && safe.length ? 
        safe[Math.floor(Math.random() * safe.length)] : best;


    return choice?.dir ?? null;
}

