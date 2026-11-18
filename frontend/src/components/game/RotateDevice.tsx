import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './RotateDevice.module.css'

export const RotDev: React.FC = () => {
    const { t } = useTranslation();

    return (
       <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.arrow}>↻</div>
                <h2 className={styles.title}>{t('local_game_rotate_title')}</h2>
                <p className={styles.subtitle}>
                    {t('local_game_rotate_subtitle')}
                </p>
            </div>
        </div>
    )
}