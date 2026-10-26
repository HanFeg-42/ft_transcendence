import type { Tile } from "../../../shared/types/game-types";

export const DEFAULT_MAZE_ID = "circuit";

export const MAZES: Record<string, string[]> = {
  circuit: [
    "###################",
    "#o...............o#",
    "#.##.###...###.##.#",
    "#.................#",
    "####.#.##.##.#.####",
    "#....#.......#....#",
    "#.................#",
    "#####.### ###.#####",
    "#####.#E   E#.#####",
    "#.....       .....#",
    "#.....       .....#",
    "#####.#E   E#.#####",
    "#####.### ###.#####",
    "#.................#",
    "#....#.......#....#",
    "####.#.##.##.#.####",
    "#........P........#",
    "#.##.###...###.##.#",
    "#o...............o#",
    "###################",
  ],
  arena: [
    "###################",
    "#o...............o#",
    "#.................#",
    "#..##...#.#...##..#",
    "#..##.........##..#",
    "#.................#",
    "#.....#.....#.....#",
    "#.....### ###.....#",
    "#.....#E   E#.....#",
    "#.....       .....#",
    "#.....       .....#",
    "#.....#E   E#.....#",
    "#.....### ###.....#",
    "#.....#.....#.....#",
    "#.................#",
    "#..##....P....##..#",
    "#..##...#.#...##..#",
    "#.................#",
    "#o...............o#",
    "###################",
  ],
  crossroads: [
    "###################",
    "#####....o....#####",
    "#####.##...##.#####",
    "#####.........#####",
    "####...#...#...####",
    "#.................#",
    "#.##...........##.#",
    "#......## ##......#",
    "#o..... E E .....o#",
    "#...... E E ......#",
    "#......## ##......#",
    "#.##...........##.#",
    "#.................#",
    "####...#...#...####",
    "#####....P....#####",
    "#####.........#####",
    "#####.##...##.#####",
    "#####.........#####",
    "#####....o....#####",
    "###################",
  ],
};

export const isWall = (maze: string[], tile: Tile): boolean => maze[tile.y][tile.x] === "#";

export const parsePellets = (maze: string[]): boolean[][] => {
  const pellets: boolean[][] = [];
  const height = maze.length;
  const width = maze[0].length;
  for (let y: number = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x: number = 0; x < width; x++) {
      row.push(maze[y][x] === "." || maze[y][x] === "o");
    }
    pellets.push(row);
  }
  return pellets;
};

export const findSpawn = (maze: string[]): Tile => {
  const height = maze.length;

  for (let y: number = 0; y < height; y++) {
    const x: number = maze[y].indexOf("P");
    if (x !== -1) return { x, y };
  }
  return { x: -1, y: -1 };
};

export const findChaserSpawns = (maze: string[]): Tile[] => {
  const height = maze.length;
  const width = maze[0].length;
  const spawns: Tile[] = [];

  for (let y: number = 0; y < height; y++) {
    for (let x: number = 0; x < width; x++) {
      if (maze[y][x] === "E") spawns.push({ x, y });
    }
  }
  return spawns;
};
