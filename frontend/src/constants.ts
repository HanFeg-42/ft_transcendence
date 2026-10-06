// frontend/src/game/constants.ts

/**
 * Taille d'une cellule en pixels.
 * 32px = taille arcade classique.
 * Tu peux essayer 24 (petit), 32 (moyen), 40 (grand) pour ajuster le rendu.
 */
export const CELL_SIZE = 32;

/**
 * Couleurs du thème néon.
 * Centralisées ici pour changer le thème en 1 ligne.
 */
export const COLORS = {
    // Fond
    background: '#000000',

    // Murs
    wall: '#ff00ff',           // Magenta vif
    wallGlow: '#ff00ff',       // Lueur des murs

    // Pellets
    pellet: '#ffff99',         // Petit point (jaune pâle)
    powerPellet: '#ffcc00',    // Gros point (jaune doré)

    // Joueur (Pac-Man)
    player: '#ffff00',         // Jaune

    // Chasers (Fantômes) — index = chaser.id
    chasers: [
        '#ff0000', // 0 — Rouge
        '#ffb8ff', // 1 — Rose
        '#00ffff', // 2 — Cyan
        '#ffb851', // 3 — Orange
    ],

    // HUD
    text: '#ffffff',
    textAccent: '#ff00ff',
} as const;

/**
 * Nombre de ticks par seconde (doit matcher le service).
 * Utilisé uniquement si tu veux faire des animations côté frontend.
 * ⚠️ Ne PAS redéfinir TICKS_PER_TILE ici → il est déjà dans movement.ts
 */
export const TICKS_PER_SECOND = 30;

/**
 * Taille de police pour le HUD (score, vies, timer).
 */
export const HUD_FONT_SIZE = 16;