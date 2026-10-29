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
  getUserInfo,
  type UserInfo,
} from "../utils/notificationText";

const routeMap: Record<string, string> = {
  HOME: "/home",
  LEADERBOARD: "/leaderboard",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};
// white in dark mode, deep purple in light mode (same #30213f the theme uses)
const TEXT = "text-white in-[.pacova-light]:text-[#30213f]";
// secondary text: timestamps, × button, toolbar actions
const MUTED = "text-gray-400 in-[.pacova-light]:text-[#6b5a78]";

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

// Round avatar like the Leaderboard: picture, then initial, then type icon.
function RowAvatar({
  info,
  icon,
  isActor,
}: {
  info?: UserInfo;
  icon: string;
  isActor: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const base = "shrink-0 w-10 h-10 rounded-full flex items-center justify-center";

  if (isActor && info?.avatarUrl && !imgFailed) {
    return (
      <img
        src={info.avatarUrl}
        alt=""
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} bg-pacova-surface border border-pacova-pink font-pixelify ${TEXT}`}
    >
      {isActor && info ? info.name.charAt(0).toUpperCase() : icon}
    </span>
  );
}

interface RowProps {
  notification: Notification;
  token: string | null;
  onOpen: (notification: Notification, link?: string) => void;
  onDelete: (id: string) => void;
}

function NotificationRow({ notification, token, onOpen, onDelete }: RowProps) {
  const { t, i18n } = useTranslation();
  const [info, setInfo] = useState<UserInfo | undefined>(undefined);

  const actorId = getActorId(notification);

  useEffect(() => {
    if (!token || !actorId) return;

    let cancelled = false;
    getUserInfo(token, actorId).then((resolved) => {
      if (!cancelled) setInfo(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [token, actorId]);

  const isUnread = !notification.isRead;
  const view = describeNotification(notification, info?.name, t);
  const locale = i18n.resolvedLanguage || "en";

  return (
    <li
      className={`flex items-center border-b border-white/10 ${
        isUnread ? "bg-pacova-pink/15" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(notification, view.link)}
        className="flex-1 min-w-0 flex items-center gap-4 px-3 py-3 text-start cursor-pointer"
      >
        <RowAvatar info={info} icon={view.icon} isActor={actorId !== undefined} />

        <div className={`flex-1 min-w-0 ${TEXT} ${isUnread ? "" : "opacity-60"}`}>
          <p className="font-vt323 text-xl sm:text-2xl leading-tight">
            {view.text}
          </p>
          <p className={`font-vt323 text-base ${MUTED}`}>
            {formatTime(notification.createdAt, locale)}
          </p>
        </div>

        {isUnread && (
          <span
            aria-hidden="true"
            className="shrink-0 w-2.5 h-2.5 rounded-full bg-pacova-pink"
          />
        )}
      </button>

      <button
        type="button"
        aria-label={t("notif_delete")}
        title={t("notif_delete")}
        onClick={() => onDelete(notification.id)}
        className={`shrink-0 px-4 py-3 font-vt323 text-2xl ${MUTED} hover:text-pacova-pink transition-colors cursor-pointer`}      >
        ×
      </button>
    </li>
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
    const path = routeMap[tab];
    if (path) navigate(path);
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

  const actionClass = `font-vt323 text-lg ${MUTED} hover:text-pacova-pink transition-colors cursor-pointer`;
  
    return (
    <Background>
      <Navbar activeTab="NOTIFICATION" onSelectTab={handleSelectTab} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {loading && notifications.length === 0 ? (
          <p role="status" className={`font-vt323 text-xl ${TEXT}`}>
            {t("notif_loading")}
          </p>
        ) : error ? (
          <p role="alert" className="font-vt323 text-xl text-pacova-pink">
            {t(error)}
          </p>
        ) : notifications.length === 0 ? (
          <p className={`font-vt323 text-xl ${TEXT}`}>{t("notif_emptyText")}</p>
        ) : (
          <>
            <div className="flex justify-end gap-6 mb-2">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead} className={actionClass}>
                  {t("notif_markAllRead")}
                </button>
              )}
              <button type="button" onClick={handleClearAll} className={actionClass}>
                {t("notif_clearAll")}
              </button>
            </div>

            <ul>
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  token={token}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </>
        )}
      </main>
    </Background>
  );
}