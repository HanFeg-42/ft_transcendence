// src/ai/distance.ts

export type Tile = { x: number; y: number };

/**
 * BFS from `start` over the whole maze.
 * Returns dist[y][x] = number of moves to reach (x, y).
 * Walls and unreachable tiles stay Infinity.
 */
export function distanceMap(
  start: Tile,
  width: number,
  height: number,
  isBlocked: (x: number, y: number) => boolean
): number[][] {
  const dist: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(Infinity)
  );

  if (isBlocked(start.x, start.y)) return dist;

  const steps = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  const queue: Tile[] = [start];
  let head = 0; // index pointer instead of shift() (O(1) instead of O(n))
  dist[start.y][start.x] = 0;

  while (head < queue.length) {
    const { x, y } = queue[head++];
    const d = dist[y][x];

    for (const { dx, dy } of steps) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (isBlocked(nx, ny)) continue;
      if (dist[ny][nx] !== Infinity) continue; // already visited

      dist[ny][nx] = d + 1;
      queue.push({ x: nx, y: ny });
    }
  }

  return dist;
}

/** Debug helper: prints the grid, walls as ##, unreachable as ??. */
export function printDistanceMap(dist: number[][]): void {
  const rows = dist.map((row) =>
    row
      .map((d) => (d === Infinity ? "##" : String(d).padStart(2, " ")))
      .join(" ")
  );
  console.log(rows.join("\n"));
}