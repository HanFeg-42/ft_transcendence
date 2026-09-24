import type { Tile } from "../../../shared/types/game-types";

export const MAZE: string[] = [
  "###################",
  "#o.......#.......o#",
  "#.##.#########.##.#",
  "#....#E.E.E.E#....#",
  "#........#........#",
  "#.................#",
  "#.......#.#.......#",
  "#.##.##.....##.##.#",
  "#........P........#",
  "#.##.##.###.##.##.#",
  "#........#........#",
  "###.####.#.####.###",
  "#.......#.#.......#",
  "#.##.##.....##.##.#",
  "#.................#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.##.###.##.##.#",
  "#o.......#.......o#",
  "###################",
];


export const WIDTH: number = MAZE[0].length;
export const HEIGHT: number = MAZE.length;

export const isWall = (tile: Tile): boolean => MAZE[tile.y][tile.x] === "#";

export const parsePellets = (): boolean[][] => {
  const pellets: boolean[][] = [];
  for (let y: number = 0; y < HEIGHT; y++) {
    const row: boolean[] = [];
    for (let x: number = 0; x < WIDTH; x++) {
      row.push(MAZE[y][x] === "." || MAZE[y][x] === "o");
    }
    pellets.push(row);
  }
  return pellets;
};

export const findSpawn = (): Tile => {
  for (let y: number = 0; y < HEIGHT; y++) {
    const x: number = MAZE[y].indexOf("P");
    if (x !== -1) return { x, y };
  }
  return { x: -1, y: -1 };
};

export const findChaserSpawns = (): Tile[] => {
  const spawns: Tile[] = [];
  for (let y: number = 0; y < HEIGHT; y++) {
    for (let x: number = 0; x < WIDTH; x++) {
      if (MAZE[y][x] === "E") spawns.push({ x, y });
    }
  }
  return spawns;
};
