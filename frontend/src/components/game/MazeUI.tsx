import React from 'react';
import type { GameState } from '../../../../shared/types/game-types';
import { MAZES, DEFAULT_MAZE_ID } from '../../engine/maze';
import { TICKS_PER_TILE } from '../../engine/movement';
import { CELL_SIZE } from '../../constants';
import styles from './MazeUI.module.css';

interface MazeUIProps {
    state: GameState;
    mazeId?: string;
}

const GHOST_COLORS = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb851'];

// ⭐ Fonction 1 : position pixel (définie UNE SEULE FOIS)
const getPixelPosition = (
    tile: { x: number; y: number },
    dir: string | null,
    step: number
): { x: number; y: number } => {
    const baseX = tile.x * CELL_SIZE;
    const baseY = tile.y * CELL_SIZE;

    if (!dir || step === 0) return { x: baseX, y: baseY };

    const progress = step / TICKS_PER_TILE;
    const offset = progress * CELL_SIZE;

    switch (dir) {
        case 'UP':    return { x: baseX, y: baseY - offset };
        case 'DOWN':  return { x: baseX, y: baseY + offset };
        case 'LEFT':  return { x: baseX - offset, y: baseY };
        case 'RIGHT': return { x: baseX + offset, y: baseY };
        default:      return { x: baseX, y: baseY };
    }
};

// ⭐ Fonction 2 : rotation (définie UNE SEULE FOIS)
const getRotation = (dir: string | null): string => {
    switch (dir) {
        case 'UP':    return 'rotate(-90deg)';
        case 'DOWN':  return 'rotate(90deg)';
        case 'LEFT':  return 'rotate(180deg)';
        case 'RIGHT': return 'rotate(0deg)';
        default:      return 'rotate(0deg)';
    }
};

const MazeUI: React.FC<MazeUIProps> = ({ state, mazeId }) => {
    const { players, chasers, pellets } = state;

    const currentMazeId = mazeId ?? DEFAULT_MAZE_ID;
    const maze = MAZES[currentMazeId];

    if (!maze) {
        return <div style={{ color: 'red' }}>Labyrinthe inconnu : {currentMazeId}</div>;
    }

    const height = maze.length;
    const width = maze[0].length;

    return (
        <div
            className={styles.mazeContainer}
            style={{
                width: `${width * CELL_SIZE}px`,
                height: `${height * CELL_SIZE}px`,
                boxSizing: 'content-box',
                imageRendering: 'pixelated',
            }}
        >
            {/* 1. MURS */}
            {maze.map((row: string, y: number) =>
                row.split('').map((cell: string, x: number) =>
                    cell === '#' ? (
                        <div
                            key={`wall-${x}-${y}`}
                            className={styles.wall}
                            style={{
                                left: `${x * CELL_SIZE}px`,
                                top: `${y * CELL_SIZE}px`,
                                width: `${CELL_SIZE}px`,
                                height: `${CELL_SIZE}px`,
                            }}
                        />
                    ) : null
                )
            )}

            {/* 2. PELLETS */}
            {pellets.map((row: boolean[], y: number) =>
                row.map((hasPellet: boolean, x: number) => {
                    if (!hasPellet) return null;
                    const isPower = maze[y][x] === 'o';
                    return (
                        <div
                            key={`pellet-${x}-${y}`}
                            className={isPower ? styles.powerPellet : styles.pellet}
                            style={{
                                left: `${x * CELL_SIZE + CELL_SIZE / 2}px`,
                                top: `${y * CELL_SIZE + CELL_SIZE / 2}px`,
                            }}
                        />
                    );
                })
            )}

            {/* 3. JOUEURS — SIMPLIFIÉ : juste l'appel aux fonctions */}
            {players.map((player) => {
                const pos = getPixelPosition(player.tile, player.dir, player.step);
                return (
                    <div
                        key={`player-${player.id}`}
                        className={styles.player}
                        style={{
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                            transform: getRotation(player.dir),
                        }}
                    />
                );
            })}

            {/* 4. CHASERS */}
            {chasers.map((chaser) => {
                const pos = getPixelPosition(chaser.tile, chaser.dir, chaser.step);
                const color = GHOST_COLORS[chaser.id % GHOST_COLORS.length];
                return (
                    <svg
                        key={`chaser-${chaser.id}`}
                        className={styles.chaser}
                        viewBox="0 0 16 16"
                        style={{
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                            imageRendering: 'pixelated',
                            color: color,
                        }}
                        shapeRendering="crispEdges"
                    >
                        {/* Corps */}
                        <rect x="2" y="2" width="12" height="12" fill={color} />
                        <rect x="4" y="0" width="8" height="14" fill={color} />
                        <rect x="0" y="4" width="16" height="10" fill={color} />

                        {/* Yeux blancs */}
                        <rect x="4" y="4" width="3" height="4" fill="#ffffff" />
                        <rect x="9" y="4" width="3" height="4" fill="#ffffff" />

                        {/* Pupilles */}
                        <rect x="5" y="5" width="2" height="2" fill="#0000ff" />
                        <rect x="10" y="5" width="2" height="2" fill="#0000ff" />

                        {/* Jupe */}
                        <rect x="0" y="14" width="4" height="2" fill={color} />
                        <rect x="6" y="14" width="4" height="2" fill={color} />
                        <rect x="12" y="14" width="4" height="2" fill={color} />
                    </svg>
                );
            })}
        </div>
    );
};

export default MazeUI;