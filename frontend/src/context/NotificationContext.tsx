import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../services/notificationService";
import { useAuth } from "./AuthContext";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { pathname } = useLocation();
  const refreshId = useRef<symbol | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;

    const requestId = Symbol();
    refreshId.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const [notificationData, count] = await Promise.all([
        getNotifications(token),
        getUnreadCount(token),
      ]);

      if (requestId !== refreshId.current) return;
      setNotifications(notificationData.notifications);
      setUnreadCount(count);

      let nextCursor = notificationData.nextCursor;
      while (nextCursor !== null) {
        const page = await getNotifications(token, { cursor: nextCursor });
        if (requestId !== refreshId.current) return;
        setNotifications((current) => [...current, ...page.notifications]);
        nextCursor = page.nextCursor;
      }
    } catch (err) {
      if (requestId !== refreshId.current) return;
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      if (requestId === refreshId.current) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
    }
    return () => {
      refreshId.current = null;
    };
  }, [token, refreshNotifications, pathname]);

  const markAsRead = async (id: string) => {
    if (!token) return;

    await markNotificationRead(token, id);

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllAsRead = async () => {
    if (!token) return;

    await markAllNotificationsRead(token);

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
