import React from 'react'
import  styles from './RotateDevice.module.css'

export const RotDev: React.FC = () => {
    return (
       <div className={styles.overlay}>
            <div className={styles.content}>
                {/* <div className={styles.phone}>📱</div> */}
                <div className={styles.arrow}>↻</div>
                <h2 className={styles.title}>Tournez votre téléphone</h2>
                <p className={styles.subtitle}>
                    Le jeu se joue en mode paysage
                </p>
            </div>
        </div>
    )
}