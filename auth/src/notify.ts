export async function notify(userId: number, type: string, payload: object = {}) {
  try {
    const res = await fetch(`${process.env.CHAT_SERVICE_URL || 'http://chat:3003'}/internal/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      body: JSON.stringify({ userId, type, payload }),
    });
    // a non-2xx answer from chat is intentionally ignored: notifications are best-effort
    void res;
  } catch (e) { 
    // console.error('[NOTIFY] failed:', e); 
  }
}
