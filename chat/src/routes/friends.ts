import { Router, Request, Response } from 'express';
import { WebSocket } from 'ws';
import { prisma } from '../prisma';
import { onlineUsers, sendPresence } from '../ws/presence';
import { notifyUser } from '../notifications/notifyUser';
import { NotificationTypes } from '../../../shared/types/notification-types';
import { ChatEvents } from '../../../shared/types/chat-types';

const router = Router();
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth:3001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://user:3004';

type PublicUser = { id: number; username: string; avatar: string | null };

type Db = { blockedUser: typeof prisma.blockedUser };
const PENDING = 'pending';

// ---------- helpers ----------
const isOnline = (id: number) => (onlineUsers.get(String(id))?.size ?? 0) > 0;
const pair = (a: number, b: number) => ({ userLowId: Math.min(a, b), userHighId: Math.max(a, b) });
const fail = (res: Response, code: number, error: string) => res.status(code).json({ error });
const toId = (v: unknown) => (Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

const isBlocked = (db: Db, a: number, b: number) =>
  db.blockedUser.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } });

// Checks identity + catches errors for every route.
const route = (fn: (userId: number, req: Request, res: Response) => unknown) =>
  async (req: Request, res: Response) => {
    const raw = req.headers['x-user-id'];
    const userId = toId(Array.isArray(raw) ? raw[0] : raw);
    if (!userId) return fail(res, 401, 'Missing identity');
    try {
      await fn(userId, req, res);
    } catch {
      fail(res, 500, 'Internal server error');
    }
  };

const requestRoute = (fn: (userId: number, id: bigint, res: Response) => unknown) =>
  route((userId, req, res) =>
    /^\d+$/.test(req.params.id) && BigInt(req.params.id) > 0n
      ? fn(userId, BigInt(req.params.id), res)
      : fail(res, 400, 'Invalid request id'));

async function notifySafe(...args: Parameters<typeof notifyUser>) {
  try { await notifyUser(...args); } catch { /* a failed notification must not fail the request */ }
}

async function serializable<T>(work: (tx: any) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
    } catch (error) {
      const e = error as { code?: string; cause?: { originalCode?: string; kind?: string } };
      const retryable = e.code === 'P2034' || e.code === 'P2002' ||
        e.cause?.originalCode === '40001' || e.cause?.kind === 'TransactionWriteConflict';
      if (!retryable || attempt >= 2) throw error;
    }
  }
}

async function getJson(url: string, allow404 = false): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (allow404 && response.status === 404) return null;
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

// Also used by blocks.ts. The profile endpoint returns at most 100 ids per call.
export async function getPublicUsers(ids: number[]): Promise<PublicUser[]> {
  if (!ids.length) return [];
  const profiles = (await getJson(`${USER_URL}/profile/profiles?ids=${[...new Set(ids)].join(',')}`)) as
    { id: number; username: string; avatarUrl: string | null }[];
  return profiles.map(p => ({ id: p.id, username: p.username, avatar: p.avatarUrl }));
}

const userExists = async (id: number) => (await getJson(`${AUTH_URL}/users/${id}`, true)) !== null;
const listUserIds = async () => ((await getJson(`${AUTH_URL}/users`)) as { id: number }[]).map(u => u.id);

// ---------- websocket events ----------
function sendToUser(userId: number, event: string, data: Record<string, unknown>) {
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return;
  for (const socket of sockets) {
    if (socket.readyState !== WebSocket.OPEN) { sockets.delete(socket); continue; }
    try {
      socket.send(JSON.stringify({ event, data }));
    } catch {
      sockets.delete(socket);
    }
  }
}

function emitAccepted(a: number, b: number) {
  sendToUser(a, 'friend_accepted', { userId: b });
  sendToUser(b, 'friend_accepted', { userId: a });
  for (const socket of onlineUsers.get(String(a)) ?? []) sendPresence(socket, b, isOnline(b) ? 'online' : 'offline');
  for (const socket of onlineUsers.get(String(b)) ?? []) sendPresence(socket, a, isOnline(a) ? 'online' : 'offline');
}

async function getRelation(userId: number, otherId: number) {
  const pendingFrom = (requesterId: number, addresseeId: number) =>
    prisma.friendRequest.findFirst({ where: { requesterId, addresseeId, status: PENDING } });
  const [friendship, blocked, incoming, outgoing] = await Promise.all([
    prisma.friendship.findUnique({ where: { userLowId_userHighId: pair(userId, otherId) } }),
    isBlocked(prisma, userId, otherId),
    pendingFrom(otherId, userId),
    pendingFrom(userId, otherId),
  ]);
  return friendship ? 'friend' : blocked ? 'blocked' : incoming ? 'incoming_request' : outgoing ? 'outgoing_request' : 'none';
}

// ---------- routes ----------
router.get('/friends', route(async (userId, _req, res) => {
  const [rows, blockedRows] = await Promise.all([
    prisma.friendship.findMany({ where: { OR: [{ userLowId: userId }, { userHighId: userId }] }, orderBy: { createdAt: 'desc' } }),
    prisma.blockedUser.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } }),
  ]);
  const blocked = new Set(blockedRows.map(r => (r.blockerId === userId ? r.blockedId : r.blockerId)));
  const friendIds = rows.map(r => (r.userLowId === userId ? r.userHighId : r.userLowId)); // blocked friends stay in the list
  if (!friendIds.length) return res.json([]);

  const byId = new Map((await getPublicUsers(friendIds)).map(u => [u.id, u]));
  return res.json(friendIds.flatMap(id => (byId.has(id) ? [{ ...byId.get(id)!, online: !blocked.has(id) && isOnline(id) }] : [])));
}));

// GET /friends/requests — incoming and outgoing pending requests.
router.get('/friends/requests', route(async (userId, _req, res) => {
  const requests = await prisma.friendRequest.findMany({
    where: { status: PENDING, OR: [{ addresseeId: userId }, { requesterId: userId }] },
    orderBy: { createdAt: 'desc' },
  });
  const otherOf = (r: (typeof requests)[number]) => (r.requesterId === userId ? r.addresseeId : r.requesterId);
  const byId = new Map((await getPublicUsers([...new Set(requests.map(otherOf))])).map(u => [u.id, u]));

  const list = (mine: 'addresseeId' | 'requesterId') =>
    requests.filter(r => r[mine] === userId).flatMap(r => {
      const u = byId.get(otherOf(r));
      return u ? [{ id: r.id.toString(), userId: u.id, username: u.username, avatar: u.avatar, createdAt: r.createdAt }] : [];
    });
  return res.json({ incoming: list('addresseeId'), outgoing: list('requesterId') });
}));

// POST /friends/requests { userId } — send a request, or accept a pending reverse one.
router.post('/friends/requests', route(async (requesterId, req, res) => {
  const addresseeId = toId(req.body?.userId);
  if (!addresseeId) return fail(res, 400, 'Invalid userId');
  if (addresseeId === requesterId) return fail(res, 400, 'You cannot send a friend request to yourself');

  // The profile service creates a profile for any id, so existence is checked first.
  if (!(await userExists(addresseeId))) return fail(res, 404, 'User not found');

  const users = await getPublicUsers([requesterId, addresseeId]);
  const target = users.find(u => u.id === addresseeId);

  // One serializable transaction so A<->B requests racing resolve to a single state.
  const result = await serializable(async tx => {
    const [blocked, friendship, existing, reverse] = await Promise.all([
      isBlocked(tx, requesterId, addresseeId),
      tx.friendship.findUnique({ where: { userLowId_userHighId: pair(requesterId, addresseeId) } }),
      tx.friendRequest.findUnique({ where: { requesterId_addresseeId: { requesterId, addresseeId } } }),
      tx.friendRequest.findUnique({ where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: requesterId } } }),
    ]);
    if (blocked) return { kind: 'blocked' as const };
    if (friendship) return { kind: 'friends' as const };
    if (existing?.status === PENDING) return { kind: 'pending' as const };
    if (reverse?.status === PENDING) {
      await tx.friendship.upsert({ where: { userLowId_userHighId: pair(requesterId, addresseeId) }, update: {}, create: pair(requesterId, addresseeId) });
      await tx.friendRequest.update({ where: { id: reverse.id }, data: { status: 'accepted', respondedAt: new Date() } });
      return { kind: 'accepted' as const };
    }
    const request = await tx.friendRequest.upsert({
      where: { requesterId_addresseeId: { requesterId, addresseeId } },
      update: { status: PENDING, createdAt: new Date(), respondedAt: null },
      create: { requesterId, addresseeId, status: PENDING },
    });
    return { kind: 'created' as const, request };
  });

  if (result.kind === 'blocked') return fail(res, 403, 'Friend requests are unavailable for blocked users');
  if (result.kind === 'friends') return fail(res, 409, 'Already friends');
  if (result.kind === 'pending') return fail(res, 409, 'Friend request already pending');

  if (result.kind === 'accepted') {
    emitAccepted(requesterId, addresseeId);
    await Promise.all([
      notifySafe(requesterId, NotificationTypes.FRIEND_ACCEPTED, { userId: addresseeId }),
      notifySafe(addresseeId, NotificationTypes.FRIEND_ACCEPTED, { userId: requesterId }),
    ]);
    return res.json({ status: 'accepted', friend: target });
  }

  const payload = {
    requestId: result.request.id.toString(),
    userId: requesterId,
    username: users.find(u => u.id === requesterId)?.username ?? '',
  };
  sendToUser(addresseeId, 'friend_request', payload);
  await notifySafe(addresseeId, NotificationTypes.FRIEND_REQUEST, payload);
  return res.status(201).json({ id: payload.requestId, status: result.request.status, userId: addresseeId });
}));
// POST /friends/requests/:id/accept — accept an incoming request.
router.post('/friends/requests/:id/accept', requestRoute(async (userId, id, res) => {
  const result = await serializable(async tx => {
    const request = await tx.friendRequest.findFirst({ where: { id, addresseeId: userId, status: PENDING } });
    if (!request) return { kind: 'not_found' as const };
    if (await isBlocked(tx, userId, request.requesterId)) return { kind: 'blocked' as const };

    await tx.friendship.upsert({ where: { userLowId_userHighId: pair(userId, request.requesterId) }, update: {}, create: pair(userId, request.requesterId) });
    // Also closes a duplicate reverse pending request, if any.
    await tx.friendRequest.updateMany({
      where: { status: PENDING, OR: [{ id: request.id }, { requesterId: userId, addresseeId: request.requesterId }] },
      data: { status: 'accepted', respondedAt: new Date() },
    });
    return { kind: 'ok' as const, friendId: request.requesterId };
  });

  if (result.kind === 'not_found') return fail(res, 404, 'Pending friend request not found');
  if (result.kind === 'blocked') return fail(res, 403, 'Cannot accept a request involving a blocked user');

  emitAccepted(userId, result.friendId);
  await notifySafe(result.friendId, NotificationTypes.FRIEND_ACCEPTED, { userId });
  return res.json({ accepted: true, friendId: result.friendId });
}));

// POST /friends/requests/:id/decline — decline an incoming request.
router.post('/friends/requests/:id/decline', requestRoute(async (userId, id, res) => {
  const request = await prisma.friendRequest.findFirst({ where: { id, addresseeId: userId, status: PENDING }, select: { requesterId: true } });
  const done = request && (await prisma.friendRequest.updateMany({
    where: { id, addresseeId: userId, status: PENDING },
    data: { status: 'declined', respondedAt: new Date() },
  })).count;
  if (!request || !done) return fail(res, 404, 'Pending friend request not found');

  sendToUser(request.requesterId, 'friend_request_declined', { requestId: id.toString(), userId });
  await notifySafe(request.requesterId, NotificationTypes.FRIEND_DECLINED, { userId });
  return res.json({ declined: true });
}));

// DELETE /friends/requests/:id — cancel our outgoing request.
router.delete('/friends/requests/:id', requestRoute(async (userId, id, res) => {
  const request = await prisma.friendRequest.findFirst({ where: { id, requesterId: userId, status: PENDING }, select: { addresseeId: true } });
  const done = request && (await prisma.friendRequest.deleteMany({ where: { id, requesterId: userId, status: PENDING } })).count;
  if (!request || !done) return fail(res, 404, 'Outgoing pending request not found');

  sendToUser(request.addresseeId, 'friend_request_cancelled', { requestId: id.toString(), userId });
  await notifySafe(request.addresseeId, NotificationTypes.FRIEND_REQUEST_CANCELLED, { userId });
  return res.json({ cancelled: true });
}));

// DELETE /friends/:userId — remove an existing friendship.
router.delete('/friends/:userId', route(async (userId, req, res) => {
  const friendId = toId(req.params.userId);
  if (!friendId || friendId === userId) return fail(res, 400, 'Invalid userId');
  if (!(await prisma.friendship.deleteMany({ where: pair(userId, friendId) })).count) return fail(res, 404, 'Friendship not found');

  sendToUser(userId, ChatEvents.FRIEND_REMOVED, { userId: friendId });
  sendToUser(friendId, ChatEvents.FRIEND_REMOVED, { userId });
  await notifySafe(friendId, NotificationTypes.FRIEND_REMOVED, { userId });
  return res.json({ removed: true });
}));

// GET /users/search?q=... — never returns email, excludes self.
router.get('/users/search', route(async (userId, req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (!q) return res.json([]);
  // Ids come from auth, names come from the profile (a renamed user is found by the new name).
  const ids = (await listUserIds()).filter(id => id !== userId);
  const matches = (await getPublicUsers(ids))
    .filter(u => u.username.toLowerCase().includes(q))
    .slice(0, 20);
  return res.json(await Promise.all(matches.map(async u => ({ ...u, relation: await getRelation(userId, u.id) }))));
}));

export default router;