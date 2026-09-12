import champion from '../assets/icons/champion.png';
import cherry3d from '../assets/icons/cherry3d.png';
import diamond from '../assets/icons/diamond.png';
import gostBlue from '../assets/icons/gost-blue.png';
import gostOrange from '../assets/icons/gost-orange.png';
import gostPink3d from '../assets/icons/gost-pink-3d.png';
import gostPink from '../assets/icons/gost-pink.png';
import gostPurple from '../assets/icons/gost-purple.png';
import gostRed from '../assets/icons/gost-red.png';
import packmanBlue3d from '../assets/icons/packman-blue-3d.png';
import packman3d from '../assets/icons/packman3d.png';
import packmann from '../assets/icons/packmann.png';
import speed3d from '../assets/icons/speed3d.png';
import start3d from '../assets/icons/start-3d.png';

export const ICONS = {
  champion,
  cherry3d,
  diamond,
  'gost-blue': gostBlue,
  'gost-orange': gostOrange,
  'gost-pink-3d': gostPink3d,
  'gost-pink': gostPink,
  'gost-purple': gostPurple,
  'gost-red': gostRed,
  'packman-blue-3d': packmanBlue3d,
  packman3d,
  packmann,
  speed3d,
  'start-3d': start3d,
} as const;

export type IconName = keyof typeof ICONS;