// shared/types/notification-types.ts

export const NotificationTypes = {
  MESSAGE: "message",
} as const;

export type NotificationType =
  typeof NotificationTypes[keyof typeof NotificationTypes];

export interface MessageNotificationPayload {
  messageId: number;
  senderId: number;
}

export type NotificationPayloadMap = {
  [NotificationTypes.MESSAGE]: MessageNotificationPayload;
};

export interface NotificationSocketData {
  id: string;
  type: NotificationType;
  payload: NotificationPayloadMap[NotificationType];
  createdAt: string;
  isRead: boolean;
}