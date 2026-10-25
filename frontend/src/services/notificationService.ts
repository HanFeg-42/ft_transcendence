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

export async function getNotifications(
  token: string,
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

  const response = await fetch(
    `${API_URL}/notifications${query ? `?${query}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
}

export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch unread notification count");
  }

  const data = await response.json();
  return data.count;
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsRead(
  token: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}