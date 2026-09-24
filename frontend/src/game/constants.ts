// game/constants.ts

// Taille d'une cellule en pixels (adapte selon ton design)
export const CELL_SIZE = 32;

// Nombre de ticks pour traverser une case (doit matcher movement.ts)
export const TICKS_PER_TILE = 8;

// Couleurs du thème néon
export const COLORS = {
    wall: '#ff00ff',        // Magenta
    wallGlow: '#ff00ff',
    player: '#ffff00',      // Jaune
    pellet: '#ffff99',      // Jaune pâle
    powerPellet: '#ffcc00', // Jaune foncé
    chasers: [
        '#ff0000', // Rouge
        '#ffb8ff', // Rose
        '#00ffff', // Cyan
        '#ffb851', // Orange
    ],
} as const;