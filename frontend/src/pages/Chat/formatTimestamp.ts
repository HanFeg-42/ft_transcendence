// Shows just the time for anything sent today (matches the old behavior),
// but falls back to a date so a message from last week doesn't read as if
// it happened minutes ago.
export function formatMessageTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return time;

  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = date.toLocaleDateString(
    [],
    sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return `${datePart} ${time}`;
}