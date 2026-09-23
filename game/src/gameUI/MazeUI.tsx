// game/ui/MazeUI.tsx
import React from 'react';
import { GameState } from '../types';
import { CELL_SIZE } from '../constants';
import styles from './MazeUI.module.css';

interface MazeUIProps {
    state: GameState;
}

const MazeUI: React.FC<MazeUIProps> = ({ state }) => {
    const { maze, pacman, ghosts, dots } = state;

    return (
        <div className={styles.mazeContainer}>
            {/* 1. Les murs */}
            {maze.map((row, y) =>
                row.map((cell, x) =>
                    cell === 1 ? (
                        <div
                            key={`wall-${x}-${y}`}
                            className={styles.wall}
                            style={{
                                left: `${x * CELL_SIZE}px`,
                                top: `${y * CELL_SIZE}px`,
                            }}
                        />
                    ) : null
                )
            )}

            {/* 2. Les points */}
            {dots.map((dot, i) => (
                <div
                    key={`dot-${i}`}
                    className={dot.type === 'power' ? styles.powerDot : styles.dot}
                    style={{
                        left: `${dot.position.x * CELL_SIZE}px`,
                        top: `${dot.position.y * CELL_SIZE}px`,
                    }}
                />
            ))}

            {/* 3. Pac-Man */}
            <div
                className={styles.pacman}
                style={{
                    left: `${pacman.position.x * CELL_SIZE}px`,
                    top: `${pacman.position.y * CELL_SIZE}px`,
                }}
            />

            {/* 4. Les fantômes */}
            {ghosts.map((ghost) => (
                <div
                    key={`ghost-${ghost.id}`}
                    className={`${styles.ghost} ${styles[`ghost-${ghost.color}`]}`}
                    style={{
                        left: `${ghost.position.x * CELL_SIZE}px`,
                        top: `${ghost.position.y * CELL_SIZE}px`,
                    }}
                />
            ))}
        </div>
    );
};

export default MazeUI;