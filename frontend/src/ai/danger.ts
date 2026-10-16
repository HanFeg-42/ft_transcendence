import type {GameState, Direction, Chaser} from '../../../shared/types/game-types'
import {MAZES, isWall} from '../engine/maze'
import {ahead} from '../engine/movement'
import { directions } from './pathfinding';



// const DANGER_RADIUS = 4;