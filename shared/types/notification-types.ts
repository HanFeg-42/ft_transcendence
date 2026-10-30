// // shared/types/notification-types.ts

export const NotificationTypes = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  FRIEND_DECLINED: 'friend_declined',
  FRIEND_REQUEST_CANCELLED: 'friend_request_cancelled',
  FRIEND_REMOVED: 'friend_removed',
  PROFILE_UPDATED: 'profile_updated',
  AVATAR_UPDATED: 'avatar_updated',
  MATCH_FINISHED: 'match_finished',
  TWO_FACTOR_CHANGED: 'two_factor_changed',
} as const;

export interface UserRefPayload { userId: number }
export interface ProfileUpdatedPayload { fields: string[] }
export interface AvatarUpdatedPayload { avatarUrl: string }
export interface MatchFinishedPayload { result: 'WIN' | 'LOSS' | 'DRAW' | 'ABANDONED' }
export interface TwoFactorChangedPayload { enabled: boolean }

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
  [NotificationTypes.FRIEND_DECLINED]: UserRefPayload;
  [NotificationTypes.FRIEND_REQUEST_CANCELLED]: UserRefPayload;
  [NotificationTypes.FRIEND_REMOVED]: UserRefPayload;
  [NotificationTypes.PROFILE_UPDATED]: ProfileUpdatedPayload;
  [NotificationTypes.AVATAR_UPDATED]: AvatarUpdatedPayload;
  [NotificationTypes.MATCH_FINISHED]: MatchFinishedPayload;
  [NotificationTypes.TWO_FACTOR_CHANGED]: TwoFactorChangedPayload;
};

export interface NotificationSocketData {
  id: string;
  type: NotificationType;
  payload: NotificationPayloadMap[NotificationType];
  createdAt: string;
  isRead: boolean;
}