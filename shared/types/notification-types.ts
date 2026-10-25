// // shared/types/notification-types.ts

export const NotificationTypes = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
} as const;

export type NotificationType =
  typeof NotificationTypes[keyof typeof NotificationTypes];

export interface MessageNotificationPayload {
  messageId: number;
  senderId: number;
}

export interface FriendRequestNotificationPayload {
  requestId: string;
  userId: number;
  username: string;
}

export interface FriendAcceptedNotificationPayload {
  userId: number;
}

export type NotificationPayloadMap = {
  [NotificationTypes.MESSAGE]: MessageNotificationPayload;
  [NotificationTypes.FRIEND_REQUEST]: FriendRequestNotificationPayload;
  [NotificationTypes.FRIEND_ACCEPTED]: FriendAcceptedNotificationPayload;
};

export interface NotificationSocketData {
  id: string;
  type: NotificationType;
  payload: NotificationPayloadMap[NotificationType];
  createdAt: string;
  isRead: boolean;
}