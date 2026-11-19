import React from "react";
import type { GameState } from "../../../../shared/types/game-types";
import {
  MAZES,
  DEFAULT_MAZE_ID,
  DIFFICULTIES,
} from "../../../../shared/data/game-data";
import cherryImg from '../../assets/icons/cherry3d.png';
import { TICKS_PER_TILE } from "../../../../shared/data/game-data";
import styles from "./MazeUI.module.css";
import { useCellSize } from "../../hooks/useCellSize";

interface MazeUIProps {
  state: GameState;
  mazeId?: string;
}

const GHOST_COLORS = ["#ff0000", "#ffb8ff", "#00ffff", "#ffb851"];
// Pac-Man colors: index 0 = yellow, index 1 = pink (same order on both clients)
const PLAYER_COLORS = ["#ffff00", "rgb(149, 245, 76)"];

// ⭐ Fonction 1 : position pixel (définie UNE SEULE FOIS)
const getPixelPosition = (
  tile: { x: number; y: number },
  dir: string | null,
  step: number,
  CellSize: number,
  ticksPerTile: number,
): { x: number; y: number } => {
  const baseX = tile.x * CellSize;
  const baseY = tile.y * CellSize;

  if (!dir || step === 0) return { x: baseX, y: baseY };

  const progress = step / ticksPerTile;
  const offset = progress * CellSize;

  switch (dir) {
    case "UP":
      return { x: baseX, y: baseY - offset };
    case "DOWN":
      return { x: baseX, y: baseY + offset };
    case "LEFT":
      return { x: baseX - offset, y: baseY };
    case "RIGHT":
      return { x: baseX + offset, y: baseY };
    default:
      return { x: baseX, y: baseY };
  }
};

// ⭐ Fonction 2 : rotation (définie UNE SEULE FOIS)
const getRotation = (dir: string | null): string => {
  switch (dir) {
    case "UP":
      return "rotate(-90deg)";
    case "DOWN":
      return "rotate(90deg)";
    case "LEFT":
      return "rotate(180deg)";
    case "RIGHT":
      return "rotate(0deg)";
    default:
      return "rotate(0deg)";
  }
};

const MazeUI: React.FC<MazeUIProps> = ({ state, mazeId }) => {
  const { players, chasers, pellets, fruits } = state;

const currentMazeId = mazeId ?? DEFAULT_MAZE_ID;
const maze = MAZES[currentMazeId];

const width = maze?.[0].length ?? 0;
const CELL_SIZE = useCellSize(width);   // always called, every render

if (!maze) {
  return (
    <div style={{ color: "red" }}>Labyrinthe inconnu : {currentMazeId}</div>
  );
}

const height = maze.length;
  return (
    <div
      className={styles.mazeContainer}
      style={{
        width: `${width * CELL_SIZE}px`,
        height: `${height * CELL_SIZE}px`,
        boxSizing: "content-box",
        imageRendering: "pixelated",
      }}
    >
      {/* 1. MURS */}
      {maze.map((row: string, y: number) =>
        row.split("").map((cell: string, x: number) =>
          cell === "#" ? (
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
          ) : null,
        ),
      )}

      {/* 2. PELLETS */}
      {pellets.map((row: boolean[], y: number) =>
        row.map((hasPellet: boolean, x: number) => {
          if (!hasPellet) return null;
          const isPower = maze[y][x] === "o";
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
        }),
      )}

      {/* 3. JOUEURS — SIMPLIFIÉ : juste l'appel aux fonctions */}
      {/* {players.map((player) => {
        const pos = getPixelPosition(
          player.tile,
          player.dir,
          player.step,
          CELL_SIZE,
          TICKS_PER_TILE,
        );
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
      })} */}

        {players.map((player, index) => {
        const pos = getPixelPosition(
          player.tile,
          player.dir,
          player.step,
          CELL_SIZE,
          TICKS_PER_TILE,
        );
        return (
          <div
            key={`player-${player.id}`}
            className={styles.player}
            style={
              {
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                transform: getRotation(player.dir),
                // CSS variable read by .player in the CSS file
                "--pac-color": PLAYER_COLORS[index % PLAYER_COLORS.length],
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* FRUITS */}
      {fruits.map((row, y) =>
        row.map((hasFruit, x) => {
          if (!hasFruit) return null;

          return (
            <img
              key={`fruit-${x}-${y}`}
              src={cherryImg}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position: 'absolute',
                left: `${x * CELL_SIZE + CELL_SIZE / 2}px`,
                top: `${y * CELL_SIZE + CELL_SIZE / 2}px`,
                width: `${CELL_SIZE * 0.75}px`,
                height: `${CELL_SIZE * 0.75}px`,
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 2,
                imageRendering: 'pixelated',
              }}
            />
          );
        })
      )}

            {/* 4. CHASERS */}
      {chasers.map((chaser) => {
        const pos = getPixelPosition(
          chaser.tile,
          chaser.dir,
          chaser.step,
          CELL_SIZE,
          DIFFICULTIES[state.difficulty],
        );

        // eatable = power pellet active AND this ghost not eaten yet
        const isFrightened = state.vulnerableTimer > 0 && !chaser.isEaten;
        // last ~3 s (90 ticks at 30 ticks/s): flash blue <-> white
        const flashWhite =
          isFrightened &&
          state.vulnerableTimer < 90 &&
          Math.floor(state.tick / 8) % 2 === 0;

        const normalColor = GHOST_COLORS[chaser.id % GHOST_COLORS.length];
        const color = isFrightened
          ? flashWhite
            ? "#ffffff"
            : "#2121ff"
          : normalColor;

        // frightened face: pale eyes + red pupils (visible on blue AND white)
        const eyeFill = isFrightened ? "#ffb8ae" : "#ffffff";
        const pupilFill = isFrightened ? "#ff0000" : "#0000ff";

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
              imageRendering: "pixelated",
              color: color, // also drives the glow (currentColor in the CSS)
            }}
            shapeRendering="crispEdges"
          >
            {/* Corps */}
            <rect x="2" y="2" width="12" height="12" fill={color} />
            <rect x="4" y="0" width="8" height="14" fill={color} />
            <rect x="0" y="4" width="16" height="10" fill={color} />

            {/* Yeux */}
            <rect x="4" y="4" width="3" height="4" fill={eyeFill} />
            <rect x="9" y="4" width="3" height="4" fill={eyeFill} />

            {/* Pupilles */}
            <rect x="5" y="5" width="2" height="2" fill={pupilFill} />
            <rect x="10" y="5" width="2" height="2" fill={pupilFill} />

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
