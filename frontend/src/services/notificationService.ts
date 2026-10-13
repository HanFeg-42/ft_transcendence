import { authenticatedFetch } from "./authenticatedFetch";

const API_URL = "/api/chat";

export interface Notification {
  id: string;
  userId: number;
  type: string;
  payload: {
    messageId: number;
    senderId: number;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  nextCursor: string | null;
}

/**
 * Retrieves the authenticated user's notifications.
 *
 * Supports cursor pagination, unread filtering, and a result limit.
 * Uses authenticatedFetch to refresh an expired access token and retry
 * the request once.
 *
 * @param token - The current access token.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @param options - Optional pagination and filtering settings.
 * @returns The notifications and the cursor for the next page.
 * @throws Error if the notifications cannot be fetched.
 */
export async function getNotifications(
  token: string,
  refreshAccessToken: () => Promise<string | null>,
  options: {
    cursor?: string;
    unread?: boolean;
    limit?: number;
  } = {},
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (options.cursor) params.set("cursor", options.cursor);
  if (options.unread !== undefined) {
    params.set("unread", String(options.unread));
  }
  if (options.limit) params.set("limit", String(options.limit));

  const query = params.toString();
  const url = `${API_URL}/notifications${query ? `?${query}` : ""}`;

  const response = await authenticatedFetch(
    url,
    token,
    refreshAccessToken,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
}

/**
 * Retrieves the number of unread notifications for the authenticated user.
 *
 * Uses authenticatedFetch so an expired access token can be refreshed
 * and the request retried once.
 *
 * @param token - The current access token.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @returns The current unread notification count.
 * @throws Error if the count cannot be fetched.
 */
export async function getUnreadCount(
  token: string,
  refreshAccessToken: () => Promise<string | null>,
): Promise<number> {
  const response = await authenticatedFetch(
    `${API_URL}/notifications/unread-count`,
    token,
    refreshAccessToken,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch unread notification count");
  }

  const data = await response.json();
  return data.count;
}

/**
 * Marks a single notification as read.
 *
 * Uses authenticatedFetch to refresh an expired access token and retry
 * the request once. The backend remains responsible for verifying that
 * the notification belongs to the authenticated user.
 *
 * @param token - The current access token.
 * @param notificationId - The ID of the notification to mark as read.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @returns Resolves when the notification has been marked as read.
 * @throws Error if the request fails.
 */
export async function markNotificationRead(
  token: string,
  notificationId: string,
  refreshAccessToken: () => Promise<string | null>,
): Promise<void> {
  const response = await authenticatedFetch(
    `${API_URL}/notifications/${notificationId}/read`,
    token,
    refreshAccessToken,
    { method: "PATCH" },
  );

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Marks all notifications belonging to the authenticated user as read.
 *
 * Uses authenticatedFetch to refresh an expired access token and retry
 * the request once. The backend determines which notifications the user
 * is authorized to update.
 *
 * @param token - The current access token.
 * @param refreshAccessToken - Callback that obtains a new access token.
 * @returns Resolves when all notifications have been marked as read.
 * @throws Error if the request fails.
 */
export async function markAllNotificationsRead(
  token: string,
  refreshAccessToken: () => Promise<string | null>,
): Promise<void> {
  const response = await authenticatedFetch(
    `${API_URL}/notifications/read-all`,
    token,
    refreshAccessToken,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}
