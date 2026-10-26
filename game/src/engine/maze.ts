import type { Tile } from "../../../shared/types/game-types";

export const isWall = (maze: string[], tile: Tile): boolean =>
  maze[tile.y][tile.x] === "#";

export const parseCollectibles = (
  maze: string[],
  letters: string[],
): boolean[][] => {
  const pellets: boolean[][] = [];
  const height = maze.length;
  const width = maze[0].length;
  for (let y: number = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x: number = 0; x < width; x++) {
      row.push(letters.includes(maze[y][x]));
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
