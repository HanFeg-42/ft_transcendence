import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import type { Notification } from "../services/notificationService";
import {
  describeNotification,
  getActorId,
  getUserName,
} from "../utils/notificationText";

function formatTime(dateString: string, locale: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RowProps {
  notification: Notification;
  token: string | null;
  onOpen: (notification: Notification, link?: string) => void;
  onDelete: (id: string) => void;
}

function NotificationRow({ notification, token, onOpen, onDelete }: RowProps) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const actorId = getActorId(notification);
    if (!token || !actorId) return;

    let cancelled = false;
    getUserName(token, actorId).then((resolved) => {
      if (!cancelled) setName(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [notification, token]);

  const isUnread = !notification.isRead;
  const view = describeNotification(notification, name, t);
  const locale = i18n.resolvedLanguage || "en";

  return (
    <div
      className={`
        w-full rounded-lg border-2 transition-all flex items-stretch
        ${
          isUnread
            ? "border-pacova-pink bg-pacova-pink/5 shadow-neon-pink"
            : "border-gray-700 bg-black/10 hover:border-gray-600"
        }
      `}
    >
      <button
        type="button"
        onClick={() => onOpen(notification, view.link)}
        className="flex-1 min-w-0 text-start px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div
            className={`
              shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2
              ${
                isUnread
                  ? "border-pacova-pink text-pacova-pink"
                  : "border-gray-700 text-gray-600"
              }
            `}
          >
            <span className="font-pixelify text-lg">{view.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`font-vt323 text-2xl ${
                isUnread ? "text-white" : "text-gray-400"
              }`}
            >
              {view.text}
            </p>

            <p className="font-vt323 text-lg text-gray-500 mt-1">
              {formatTime(notification.createdAt, locale)}
            </p>
          </div>

          {isUnread && (
            <span className="shrink-0 w-3 h-3 rounded-full bg-pacova-pink shadow-neon-pink" />
          )}
        </div>
      </button>

      <button
        type="button"
        aria-label={t("notif_delete")}
        title={t("notif_delete")}
        onClick={() => onDelete(notification.id)}
        className="shrink-0 px-5 font-pixelify text-2xl text-gray-500 hover:text-pacova-pink transition-colors cursor-pointer border-s border-gray-700"
      >
        ×
      </button>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuth();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const handleSelectTab = (tab: string) => {
    const routes: Record<string, string> = {
      HOME: "/home",
      LEADERBOARD: "/leaderboard",
      PROFILE: "/profile",
      CHAT: "/chat",
      NOTIFICATION: "/notifications",
      SETTINGS: "/settings",
    };

    const path = routes[tab];

    if (path) {
      navigate(path);
    }
  };

  const handleOpen = (notification: Notification, link?: string) => {
    if (!notification.isRead) {
      void markAsRead(notification.id);
    }
    if (link) {
      navigate(link);
    }
  };

  const handleDelete = (id: string) => {
    removeNotification(id).catch((err) =>
      console.error("Failed to delete notification:", err),
    );
  };

  const handleClearAll = () => {
    clearAll().catch((err) =>
      console.error("Failed to clear notifications:", err),
    );
  };

  // Only show the full-page loader on the very first load, not on every refresh.
  if (loading && notifications.length === 0) {
    return (
      <Background>
        <Navbar activeTab="NOTIFICATION" onSelectTab={handleSelectTab} />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-pixelify text-pacova-pink text-3xl uppercase">
              {t("notif_loading")}
            </p>
          </div>
        </main>
      </Background>
    );
  }

  if (error) {
    return (
      <Background>
        <Navbar activeTab="NOTIFICATION" onSelectTab={handleSelectTab} />

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-pacova-surface border-2 border-pacova-pink rounded-lg px-8 py-6">
            <p className="font-vt323 text-2xl text-pacova-pink">{t(error)}</p>
          </div>
        </main>
      </Background>
    );
  }

  return (
    <Background>
      <Navbar activeTab="NOTIFICATION" onSelectTab={handleSelectTab} />

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 overflow-hidden">
        <section className="h-full bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <header className="px-6 py-5 border-b-2 border-pacova-green-dark flex items-center justify-between gap-4">
            <div>
              <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
                {t("notif_pageTitle")}
              </h1>

              <p className="font-vt323 text-xl text-gray-500 mt-1">
                {t("notif_pageSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="font-vt323 text-xl text-gray-400 hover:text-pacova-pink transition-colors cursor-pointer border border-gray-700 hover:border-pacova-pink rounded px-4 py-2"
                >
                  {t("notif_markAllRead")}
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="font-vt323 text-xl text-gray-400 hover:text-pacova-pink transition-colors cursor-pointer border border-gray-700 hover:border-pacova-pink rounded px-4 py-2"
                >
                  {t("notif_clearAll")}
                </button>
              )}
            </div>
          </header>

          {/* Notification list */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {notifications.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="font-pixelify text-6xl text-pacova-green-dark mb-4">
                    ✓
                  </div>

                  <h2 className="font-pixelify text-2xl text-white uppercase">
                    {t("notif_emptyTitle")}
                  </h2>

                  <p className="font-vt323 text-xl text-gray-500 mt-2">
                    {t("notif_emptyText")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    token={token}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Background>
  );
}