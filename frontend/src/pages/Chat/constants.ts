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


// Kills every glow/shine source (box-shadow, drop-shadow, filter) on buttons
// and inputs, no matter what the shared components bake in.
export const NO_GLOW = 'shadow-none [box-shadow:none!important] [filter:none!important]';

// CHANGED: custom scrollbar classes so the message list's scrollbar matches
// the neon pink/green look instead of the default OS grey bar. Webkit gets
// the real styled bar; scrollbar-width/-color cover Firefox.
export const NEON_SCROLLBAR =
  '[&::-webkit-scrollbar]:w-2 ' +
  '[&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:bg-pacova-pink/50 ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full ' +
  'hover:[&::-webkit-scrollbar-thumb]:bg-pacova-pink ' +
  '[scrollbar-width:thin] ' +
  '[scrollbar-color:theme(colors.pacova-pink)_transparent]';