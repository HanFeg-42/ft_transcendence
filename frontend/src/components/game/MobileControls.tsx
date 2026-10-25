import React from 'react';
import type { Direction } from '../../../../shared/types/game-types';
import styles from './MobileControls.module.css';

interface MobileControlsProps {
    onInput: (dir: Direction) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onInput }) => {
    return (
        <div className={styles.controls}>
            <button
                className={`${styles.btn} ${styles.up}`}
                onPointerDown={() => onInput('UP')}
                aria-label="Haut"
            >
                ▲
            </button>
            <button
                className={`${styles.btn} ${styles.left}`}
                onPointerDown={() => onInput('LEFT')}
                aria-label="Gauche"
            >
                ◀
            </button>
            <button
                className={`${styles.btn} ${styles.right}`}
                onPointerDown={() => onInput('RIGHT')}
                aria-label="Droite"
            >
                ▶
            </button>
            <button
                className={`${styles.btn} ${styles.down}`}
                onPointerDown={() => onInput('DOWN')}
                aria-label="Bas"
            >
                ▼
            </button>
        </div>
    );
};

export default MobileControls;