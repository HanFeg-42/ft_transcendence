export interface Friend {
  id: number;
  username: string;
  status: 'online' | 'offline';
  avatar: string | null;
}

// Temporary friends list until the friends service is connected.
// export const MOCK_FRIENDS: Friend[] = [
//   { id: 1, username: 'user1', status: 'online' },
//   { id: 2, username: 'user2', status: 'offline' },
//   { id: 3, username: 'user3', status: 'online' },
// ];

// export const GAME_ROUTE = '/game/online'; 

export const routeMap: Record<string, string> = {
  HOME: '/home',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  CHAT: '/chat',
  NOTIFICATION: '/notifications',
  SETTINGS: '/settings',
};

// Kills every glow/shine source on buttons and inputs.
// export const NO_GLOW = 'shadow-none [box-shadow:none!important] [filter:none!important]';

// // Neon pink scrollbar for the message list (webkit + Firefox).
// export const NEON_SCROLLBAR =
//   '[&::-webkit-scrollbar]:w-2 ' +
//   '[&::-webkit-scrollbar-track]:bg-transparent ' +
//   '[&::-webkit-scrollbar-thumb]:bg-pacova-pink/50 ' +
//   '[&::-webkit-scrollbar-thumb]:rounded-full ' +
//   'hover:[&::-webkit-scrollbar-thumb]:bg-pacova-pink ' +
//   '[scrollbar-width:thin] ' +
//   '[scrollbar-color:theme(colors.pacova-pink)_transparent]';

// // "03:15 PM" if today, otherwise "Oct 9, 03:15 PM"
// export function formatTime(iso: string) {
//   const d = new Date(iso);
//   const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   if (d.toDateString() === new Date().toDateString()) return time;
//   return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
// }