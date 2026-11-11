export async function notify(userId: number, type: string, payload: object = {}) {
  try {
    await fetch(`${process.env.CHAT_SERVICE_URL || 'http://chat:3003'}/internal/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      body: JSON.stringify({ userId, type, payload }),
    });
  } catch (e) { console.error('[NOTIFY] failed:', e); }
}