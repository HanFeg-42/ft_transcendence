import { WebSocket } from 'ws';
import { prisma } from '../prisma';
import { onlineUsers } from '../ws/presence';
import { ChatEvents, ChatServerMessage } from '../../../shared/types/chat-types';
import {
  NotificationType,
  NotificationPayloadMap,
  NotificationSocketData,
} from '../../../shared/types/notification-types';

export async function notifyUser<T extends NotificationType>(
  userId: number,
  type: T,
  payload: NotificationPayloadMap[T],
): Promise<void> {
  // 1. Store the notification first.
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  // 2. Look for the user's currently connected sockets.
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return;

  // 3. Build the realtime notification packet.
  const data: NotificationSocketData = {
    id: notification.id.toString(),
    type,
    payload,
    createdAt: notification.createdAt.toISOString(),
    isRead: notification.isRead,
  };

  const packet: ChatServerMessage = {
    event: ChatEvents.NOTIFICATION,
    data,
  };

  // 4. Send to every open tab/device.
  for (const socket of sockets) {
    if (socket.readyState !== WebSocket.OPEN) {
      sockets.delete(socket);
      continue;
    }

    try {
      socket.send(JSON.stringify(packet));
    } catch (err) {
      console.warn(
        '[CHAT-SERVICE] Failed to send notification to socket:',
        err,
      );
    }
  }
}