import { Router } from 'express';
import { notifyUser } from '../notifications/notifyUser';
import { NotificationTypes } from '../../../shared/types/notification-types';

const router = Router();
const KEY = process.env.INTERNAL_API_KEY;

router.post('/internal/notifications', async (req, res) => {
  if (!KEY || req.headers['x-internal-key'] !== KEY)
    return res.status(403).json({ error: 'Forbidden' });
  const { userId, type, payload } = req.body ?? {};
  if (!Number.isSafeInteger(userId) || !Object.values(NotificationTypes).includes(type))
    return res.status(400).json({ error: 'Invalid notification' });
  await notifyUser(userId, type, payload ?? {});
  return res.status(201).json({ ok: true });
});
export default router;