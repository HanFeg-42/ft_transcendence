import { useEffect, useState } from 'react';

/**
 * Calcule la taille d'une cellule en fonction de la taille de l'écran.
 * - Desktop : 32px (taille originale)
 * - Tablette : 24px
 * - Mobile : 18px
 */
export function useCellSize(mazeWidth: number) {
    const [cellSize, setCellSize] = useState(32);

    useEffect(() => {
        const updateSize = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            // ⭐ On garde une marge pour le HUD et les bordures
            const maxWidth = screenWidth - 200;   // 100px pour chaque barre HUD
            const maxHeight = screenHeight - 100; // 100px pour le HUD top
            
            // ⭐ Calcule la taille max possible sans dépasser
            const sizeByWidth = Math.floor(maxWidth / mazeWidth);
            const sizeByHeight = Math.floor(maxHeight / 20); // 20 = hauteur du maze
            
            // ⭐ Prend la plus petite des deux pour que tout tienne
            const newSize = Math.min(sizeByWidth, sizeByHeight, 32);
            
            // ⭐ Sécurité : minimum 12px pour que ce soit jouable
            setCellSize(Math.max(newSize, 12));
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [mazeWidth]);

    return cellSize;
}