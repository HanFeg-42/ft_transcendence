export async function notify(userId: number, type: string, payload: object = {}) {
  try {
    const res = await fetch(`${process.env.CHAT_SERVICE_URL || 'http://chat:3003'}/internal/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      body: JSON.stringify({ userId, type, payload }),
    });
    if (!res.ok) console.error('[NOTIFY] chat service answered', res.status);
  } catch (e) { console.error('[NOTIFY] failed:', e); }
}