import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { onlineUsers, sendPresence } from '../ws/presence';
import { notifyUser } from '../notifications/notifyUser';
import { NotificationTypes } from '../../../shared/types/notification-types';
import { WebSocket } from 'ws';

const router = Router();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth:3001';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user:3004';
// 
// type PublicUser = { id: number; username: string; avatar: string | null };
type PublicUser = {
  id: number;
  username: string;
  avatar: string | null;
};
type Relation = 'self' | 'friend' | 'incoming_request' | 'outgoing_request' | 'blocked' | 'none';

function currentUserId(req: Request): number | null {
  const raw = req.headers['x-user-id'];
  const id = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function pair(a: number, b: number) {
  return { userLowId: Math.min(a, b), userHighId: Math.max(a, b) };
}
// 
function parseBigIntId(raw: string): bigint | null {
  try {
    if (!/^\d+$/.test(raw)) return null;
    const id = BigInt(raw);
    return id > 0n ? id : null;
  } catch {
    return null;
  }
}




async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getPublicUsers(userIds?: number[]): Promise<PublicUser[]> {
  const response = await fetchWithTimeout(`${AUTH_SERVICE_URL}/users`);

  if (!response.ok) {
    throw new Error(`Auth service returned ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid users response from auth service');
  }

  const users: PublicUser[] = data.flatMap((user): PublicUser[] => {
    if (user === null || typeof user !== 'object') {
      return [];
    }

    const item = user as {
      id?: unknown;
      username?: unknown;
      avatar?: unknown;
    };

    if (
      typeof item.id !== 'number' ||
      !Number.isSafeInteger(item.id) ||
      typeof item.username !== 'string'
    ) {
      return [];
    }

    return [{
      id: item.id,
      username: item.username,
      avatar: typeof item.avatar === 'string' ? item.avatar : null,
    }];
  });

  // Fetch profile data only for users this route actually needs, when IDs are supplied.
  const selectedUsers = userIds
    ? users.filter(user => userIds.includes(user.id))
    : users;

  if (selectedUsers.length === 0) {
    return selectedUsers;
  }

  const ids = selectedUsers.map(user => user.id).join(',');
  const profileResponse = await fetchWithTimeout(
    `${USER_SERVICE_URL}/profile/profiles?ids=${ids}`
  );

  if (!profileResponse.ok) {
    throw new Error(`User profile service returned ${profileResponse.status}`);
  }

  const profiles: unknown = await profileResponse.json();

  if (!Array.isArray(profiles)) {
    throw new Error('Invalid profiles response from user service');
  }

  const avatars = new Map<number, string | null>();

  for (const profile of profiles) {
    if (profile === null || typeof profile !== 'object') {
      continue;
    }

    const item = profile as {
      id?: unknown;
      avatarUrl?: unknown;
    };

    if (
      typeof item.id === 'number' &&
      Number.isSafeInteger(item.id)
    ) {
      avatars.set(
        item.id,
        typeof item.avatarUrl === 'string' ? item.avatarUrl : null
      );
    }
  }

  return selectedUsers.map(user => ({
    ...user,
    avatar: avatars.has(user.id)
      ? avatars.get(user.id)!
      : user.avatar,
  }));
}

///////////////////////
// 
function sendToUser(userId: number, event: string, data: Record<string, unknown>) {
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return;
  for (const socket of sockets) {
    if (socket.readyState !== WebSocket.OPEN) {
      sockets.delete(socket);
      continue;
    }
    try {
      socket.send(JSON.stringify({ event, data }));
    } catch (error) {
      console.warn('[CHAT] Failed to send friend event:', error);
    }
  }
}

// Friendship can be created while both users already have an open WebSocket.
// Their original partner lists were calculated before they became friends, so
// send each side the other's current status immediately after acceptance.
function syncPresenceForPair(userA: number, userB: number) {
  const aOnline = (onlineUsers.get(String(userA))?.size ?? 0) > 0;
  const bOnline = (onlineUsers.get(String(userB))?.size ?? 0) > 0;

  for (const socket of onlineUsers.get(String(userA)) ?? []) {
    sendPresence(socket, userB, bOnline ? 'online' : 'offline');
  }
  for (const socket of onlineUsers.get(String(userB)) ?? []) {
    sendPresence(socket, userA, aOnline ? 'online' : 'offline');
  }
}
// 
async function getRelation(userId: number, otherId: number): Promise<Relation> {
  if (userId === otherId) return 'self';
  const [friendship, outgoing, incoming, blocked] = await Promise.all([
    prisma.friendship.findUnique({ where: { userLowId_userHighId: pair(userId, otherId) } }),
    prisma.friendRequest.findFirst({ where: { requesterId: userId, addresseeId: otherId, status: 'pending' } }),
    prisma.friendRequest.findFirst({ where: { requesterId: otherId, addresseeId: userId, status: 'pending' } }),
    prisma.blockedUser.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: otherId }, { blockerId: otherId, blockedId: userId }] },
    }),
  ]);
  if (friendship) return 'friend';
  if (blocked) return 'blocked';
  if (incoming) return 'incoming_request';
  if (outgoing) return 'outgoing_request';
  return 'none';
}

// 
// 
// async function serializable<T>(work: (tx: any) => Promise<T>): Promise<T> {
//   for (let attempt = 0; ; attempt++) {
//     try {
//       return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
//     } catch (error) {
//       const code = typeof error === 'object' && error !== null && 'code' in error
//         ? (error as { code?: string }).code
//         : undefined;
//       if ((code === 'P2034' || code === 'P2002') && attempt < 2) continue;
//       throw error;
//     }
//   }
// }
// P2034: Prisma transaction conflict.

// 40001: PostgreSQL serialization failure.
// 
// TransactionWriteConflict: conflict f transaction.

async function serializable<T>(work: (tx: any) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: 'Serializable',
      });
    } catch (error) {
      const err = error as {
        code?: string;
        cause?: {
          originalCode?: string;
          kind?: string;
        };
      };

      const retryable =
        err.code === 'P2034' ||
        err.code === 'P2002' ||
        err.cause?.originalCode === '40001' ||
        err.cause?.kind === 'TransactionWriteConflict';

      if (retryable && attempt < 2) {
        continue;
      }

      throw error;
    }
  }
}
function handleError(res: Response, error: unknown) {
  console.error('[CHAT] Friends route error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

router.get('/friends', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });

  try {
    const rows = await prisma.friendship.findMany({
      where: {
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    const allFriendIds = rows.map(row =>
      row.userLowId === userId ? row.userHighId : row.userLowId
    );

    if (allFriendIds.length === 0) return res.json([]);

    const blockedRows = await prisma.blockedUser.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const blockedIds = new Set<number>();

    for (const row of blockedRows) {
      blockedIds.add(
        row.blockerId === userId ? row.blockedId : row.blockerId
      );
    }

    const friendIds = allFriendIds.filter(id => !blockedIds.has(id));

    if (friendIds.length === 0) return res.json([]);

    const users = await getPublicUsers(friendIds);
    const byId = new Map(users.map(user => [user.id, user]));

    const friends = friendIds.flatMap(id => {
      const user = byId.get(id);
      if (!user) return [];

      return [{
        ...user,
        online: (onlineUsers.get(String(id))?.size ?? 0) > 0,
      }];
    });

    return res.json(friends);
  } catch (error) {
    return handleError(res, error);
  }
});

// GET /friends/requests — list incoming and outgoing pending requests.
router.get('/friends/requests', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
// 
  try {
    const [requests, users] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { status: 'pending', OR: [{ addresseeId: userId }, { requesterId: userId }] },
        orderBy: { createdAt: 'desc' },
      }),
      getPublicUsers(),
    ]);
    const byId = new Map(users.map(user => [user.id, user]));
    return res.json({
      incoming: requests.filter(r => r.addresseeId === userId).flatMap(r => {
        const user = byId.get(r.requesterId);
        return user ? [{ id: r.id.toString(), userId: user.id, username: user.username, avatar: user.avatar, createdAt: r.createdAt }] : [];
      }),
      outgoing: requests.filter(r => r.requesterId === userId).flatMap(r => {
        const user = byId.get(r.addresseeId);
        return user ? [{ id: r.id.toString(), userId: user.id, username: user.username, avatar: user.avatar, createdAt: r.createdAt }] : [];
      }),
    });
  } catch (error) {
    return handleError(res, error);
  }
});
// 
// POST /friends/requests { userId } — send a request, or accept a pending reverse request.
router.post('/friends/requests', async (req: Request, res: Response) => {
  const requesterId = currentUserId(req);
  const addresseeId = Number(req.body?.userId);
  if (!requesterId) return res.status(401).json({ error: 'Missing identity' });
  if (!Number.isSafeInteger(addresseeId) || addresseeId <= 0) return res.status(400).json({ error: 'Invalid userId' });
  if (requesterId === addresseeId) return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
// 
  try {
    const users = await getPublicUsers();
    const byId = new Map(users.map(user => [user.id, user]));
    const target = byId.get(addresseeId);
    const requester = byId.get(requesterId);
    if (!target) return res.status(404).json({ error: 'User not found' });
// 
    // Keep relationship checks and writes in one serializable transaction so A<->B
    // requests racing at the same time resolve to one friendship/request state.
    const result = await serializable(async tx => {
      const [blocked, friendship, existing, reverse] = await Promise.all([
        tx.blockedUser.findFirst({ where: { OR: [{ blockerId: requesterId, blockedId: addresseeId }, { blockerId: addresseeId, blockedId: requesterId }] } }),
        tx.friendship.findUnique({ where: { userLowId_userHighId: pair(requesterId, addresseeId) } }),
        tx.friendRequest.findUnique({ where: { requesterId_addresseeId: { requesterId, addresseeId } } }),
        tx.friendRequest.findUnique({ where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: requesterId } } }),
      ]);
      if (blocked) return { kind: 'blocked' as const };
      if (friendship) return { kind: 'friends' as const };
      if (existing?.status === 'pending') return { kind: 'pending' as const };
// 
      if (reverse?.status === 'pending') {
        await tx.friendship.upsert({
          where: { userLowId_userHighId: pair(requesterId, addresseeId) },
          update: {},
          create: pair(requesterId, addresseeId),
        });
        await tx.friendRequest.update({ where: { id: reverse.id }, data: { status: 'accepted', respondedAt: new Date() } });
        return { kind: 'accepted' as const };
      }
// 
      const request = await tx.friendRequest.upsert({
        where: { requesterId_addresseeId: { requesterId, addresseeId } },
        update: { status: 'pending', createdAt: new Date(), respondedAt: null },
        create: { requesterId, addresseeId, status: 'pending' },
      });
      return { kind: 'created' as const, request };
    });
// 
    if (result.kind === 'blocked') return res.status(403).json({ error: 'Friend requests are unavailable for blocked users' });
    if (result.kind === 'friends') return res.status(409).json({ error: 'Already friends' });
    if (result.kind === 'pending') return res.status(409).json({ error: 'Friend request already pending' });
// 
    if (result.kind === 'accepted') {
      sendToUser(requesterId, 'friend_accepted', { userId: addresseeId });
      sendToUser(addresseeId, 'friend_accepted', { userId: requesterId });
      syncPresenceForPair(requesterId, addresseeId);
      try {
        await Promise.all([
          notifyUser(requesterId, NotificationTypes.FRIEND_ACCEPTED, { userId: addresseeId }),
          notifyUser(addresseeId, NotificationTypes.FRIEND_ACCEPTED, { userId: requesterId }),
        ]);
      } catch (error) {
        console.error('[CHAT] Friendship accepted, but notification delivery failed:', error);
      }
      return res.status(200).json({ status: 'accepted', friend: target });
    }
// 
    sendToUser(addresseeId, 'friend_request', { requestId: result.request.id.toString(), userId: requesterId, username: requester?.username ?? '' });
    await notifyUser(addresseeId, NotificationTypes.FRIEND_REQUEST, {
      requestId: result.request.id.toString(), userId: requesterId, username: requester?.username ?? '',
    });
    return res.status(201).json({ id: result.request.id.toString(), status: result.request.status, userId: addresseeId });
  } catch (error) {
    return handleError(res, error);
  }
});
// 
// POST /friends/requests/:id/accept
router.post('/friends/requests/:id/accept', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const requestId = parseBigIntId(req.params.id);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (requestId === null) return res.status(400).json({ error: 'Invalid request id' });
// 
  try {
    const request = await prisma.friendRequest.findFirst({ where: { id: requestId, addresseeId: userId, status: 'pending' } });
    if (!request) return res.status(404).json({ error: 'Pending friend request not found' });
    const blocked = await prisma.blockedUser.findFirst({ where: { OR: [{ blockerId: userId, blockedId: request.requesterId }, { blockerId: request.requesterId, blockedId: userId }] } });
    if (blocked) return res.status(403).json({ error: 'Cannot accept a request involving a blocked user' });
// 
    await prisma.$transaction(async tx => {
      await tx.friendship.upsert({
        where: { userLowId_userHighId: pair(userId, request.requesterId) },
        update: {},
        create: pair(userId, request.requesterId),
      });
      await tx.friendRequest.update({ where: { id: request.id }, data: { status: 'accepted', respondedAt: new Date() } });
      // Any duplicate reverse pending request is no longer needed once they are friends.
      await tx.friendRequest.updateMany({
        where: { requesterId: userId, addresseeId: request.requesterId, status: 'pending' },
        data: { status: 'accepted', respondedAt: new Date() },
      });
    }, { isolationLevel: 'Serializable' });
// 
    sendToUser(request.requesterId, 'friend_accepted', { userId });
    sendToUser(userId, 'friend_accepted', { userId: request.requesterId });
    syncPresenceForPair(userId, request.requesterId);
    try {
      await notifyUser(request.requesterId, NotificationTypes.FRIEND_ACCEPTED, { userId });
    } catch (error) {
      console.error('[CHAT] Friendship accepted, but notification delivery failed:', error);
    }
    return res.json({ accepted: true, friendId: request.requesterId });
  } catch (error) {
    return handleError(res, error);
  }
});
// 
// POST /friends/requests/:id/decline
router.post('/friends/requests/:id/decline', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const requestId = parseBigIntId(req.params.id);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (requestId === null) return res.status(400).json({ error: 'Invalid request id' });
  try {
    // Read the sender first so they can be notified after the request is declined.
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, addresseeId: userId, status: 'pending' },
      select: { requesterId: true },
    });
    if (!request) return res.status(404).json({ error: 'Pending friend request not found' });

    const result = await prisma.friendRequest.updateMany({
      where: { id: requestId, addresseeId: userId, status: 'pending' },
      data: { status: 'declined', respondedAt: new Date() },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Pending friend request not found' });

    sendToUser(request.requesterId, 'friend_request_declined', {
      requestId: requestId.toString(),
      userId,
    });
    return res.json({ declined: true });
  } catch (error) { return handleError(res, error); }
});
//
// DELETE /friends/requests/:id — cancel our outgoing request.
router.delete('/friends/requests/:id', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const requestId = parseBigIntId(req.params.id);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (requestId === null) return res.status(400).json({ error: 'Invalid request id' });
  try {
    // Read the recipient first so their pending list can be refreshed immediately.
    const request = await prisma.friendRequest.findFirst({
      where: { id: requestId, requesterId: userId, status: 'pending' },
      select: { addresseeId: true },
    });
    if (!request) return res.status(404).json({ error: 'Outgoing pending request not found' });

    const result = await prisma.friendRequest.deleteMany({
      where: { id: requestId, requesterId: userId, status: 'pending' },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Outgoing pending request not found' });

    sendToUser(request.addresseeId, 'friend_request_cancelled', {
      requestId: requestId.toString(),
      userId,
    });
    return res.json({ cancelled: true });
  } catch (error) { return handleError(res, error); }
});
// 
// DELETE /friends/:userId — remove an existing friendship.
router.delete('/friends/:userId', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  const friendId = Number(req.params.userId);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  if (!Number.isSafeInteger(friendId) || friendId <= 0 || friendId === userId) return res.status(400).json({ error: 'Invalid userId' });
  try {
    const result = await prisma.friendship.deleteMany({ where: pair(userId, friendId) });
    if (result.count === 0) return res.status(404).json({ error: 'Friendship not found' });
    sendToUser(userId, 'friend_removed', { userId: friendId });
    sendToUser(friendId, 'friend_removed', { userId });
    return res.json({ removed: true });
  } catch (error) { return handleError(res, error); }
});
// GET /users/search?q=... — public search; never returns email and excludes self.
router.get('/users/search', async (req: Request, res: Response) => {
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Missing identity' });
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (q.length < 1) return res.json([]);
  try {
    const users = await getPublicUsers();
    const matches = users.filter(user => user.id !== userId && user.username.toLowerCase().includes(q)).slice(0, 20);
    const results = await Promise.all(matches.map(async user => ({
      ...user,
      relation: await getRelation(userId, user.id),
    })));
    return res.json(results);
  } catch (error) { return handleError(res, error); }
});

export default router;