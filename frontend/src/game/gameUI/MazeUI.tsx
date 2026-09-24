// frontend/src/game/ui/MazeUI.tsx
import React from 'react';
import type { GameStatePayload } from '../../../../shared/types/game-types';
import { CELL_SIZE } from '../constants';
import styles from './MazeUI.module.css';

interface MazeUIProps {
  state: GameStatePayload;
}

const MazeUI: React.FC<MazeUIProps> = ({ state }) => {
  const { players, pellets } = state;

  return (
    <div className={styles.mazeContainer}>
      {/* Murs : hardcodés pour l'instant, MAZE doit venir du serveur plus tard */}
      {/* (ou tu peux garder MAZE en dur dans constants.ts côté frontend) */}

      {/* Pellets */}
      {pellets.map((pellet, i) => (
        <div
          key={`pellet-${i}`}
          className={styles.pellet}
          style={{
            left: `${pellet.x * CELL_SIZE + CELL_SIZE / 2}px`,
            top: `${pellet.y * CELL_SIZE + CELL_SIZE / 2}px`,
          }}
        />
      ))}

      {/* Joueurs */}
      {players.map((player) => (
        <div
          key={player.id}
          className={styles.player}
          style={{
            left: `${player.x * CELL_SIZE}px`,
            top: `${player.y * CELL_SIZE}px`,
          }}
        />
      ))}
    </div>
  );
};

export default MazeUI;