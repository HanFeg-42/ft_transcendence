import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../../../../shared/types/game-types';
import Card from '../ui/Card'
import styles from './Hud.module.css';

interface HudPlayerProps {
    player?: Player;
}

const HudPlayer: React.FC<HudPlayerProps> = ({ player }) => {
    const { t } = useTranslation();

    if (!player) {
        return <div className={styles.waiting}>{t('local_game_waiting')}</div>;
    }

    return (
        <div className={styles.playerBlock}>
            <Card variant="green" gameCard='true'>
                <div className={styles.scoreLine}>
                    <span className={styles.label}>{t('local_game_score')}</span>
                    <span className={styles.value}>{player.score}</span>
                </div>
            </Card>
            <Card variant="pink" gameCard='true'>
                <span className={`${styles.livesLabel}`}>{t('local_game_lives')}</span>
            </Card>
            <Card variant="pink" gameCard='true'>
                <div className={styles.hearts}>
                    {Array.from({ length: player.lives }).map((_, i) => (
                        <div key={i} className={styles.heart} />
                    ))}
                </div>
            </Card>

        </div>
    );
};

export default HudPlayer;