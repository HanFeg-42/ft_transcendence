// Props = the data a parent gives to a child component.
import type { Friend } from './types';
export const GAME_ROUTE = '/game-ws'   //tmp

export const MOCK_FRIENDS: Friend[] = [
  { id: 1, username: 'user1', status: 'online' },
  { id: 2, username: 'user2', status: 'offline' },
  { id: 3, username: 'user3', status: 'online' },
];

export const routeMap: Record<string, string> = {
  HOME: '/home',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};