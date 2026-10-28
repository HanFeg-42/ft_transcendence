import type { TFunction } from "i18next";
import { NotificationTypes } from "../../../shared/types/notification-types";
import { getProfileById } from "../services/userService";
import type { Notification } from "../services/notificationService";

export interface NotificationView {
  icon: string;
  text: string;
  link?: string;
}

// ---- name resolving (cached, one request per user id) ----

const nameCache = new Map<number, Promise<string>>();

export function getUserName(token: string, userId: number): Promise<string> {
  let cached = nameCache.get(userId);

  if (!cached) {
    cached = getProfileById(token, userId)
      .then((profile) => profile.username || `#${userId}`)
      .catch(() => {
        nameCache.delete(userId); // allow a retry next time
        return `#${userId}`;
      });
    nameCache.set(userId, cached);
  }

  return cached;
}

// Which user (if any) a notification is "about".
const ACTOR_FIELD: Record<string, string> = {
  [NotificationTypes.MESSAGE]: "senderId",
  [NotificationTypes.FRIEND_REQUEST]: "userId",
  [NotificationTypes.FRIEND_ACCEPTED]: "userId",
  [NotificationTypes.FRIEND_DECLINED]: "userId",
  [NotificationTypes.FRIEND_REQUEST_CANCELLED]: "userId",
  [NotificationTypes.FRIEND_REMOVED]: "userId",
};

export function getActorId(n: Notification): number | undefined {
  const field = ACTOR_FIELD[n.type];
  if (!field) return undefined;

  const id = Number(n.payload[field]);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

// ---- translated text / icon / link per type ----

export function describeNotification(
  n: Notification,
  name: string | undefined,
  t: TFunction,
): NotificationView {
  const who = name ?? t("notif_unknownUser");

  switch (n.type) {
    case NotificationTypes.MESSAGE:
      return {
        icon: "✉",
        text: t("notif_message", { name: who }),
        link: "/chat",
      };

    case NotificationTypes.FRIEND_REQUEST:
      return {
        icon: "+",
        text: t("notif_friendRequest", { name: who }),
        link: "/chat",
      };

    case NotificationTypes.FRIEND_ACCEPTED:
      return {
        icon: "✓",
        text: t("notif_friendAccepted", { name: who }),
        link: "/chat",
      };

    case NotificationTypes.FRIEND_DECLINED:
      return {
        icon: "✕",
        text: t("notif_friendDeclined", { name: who }),
      };

    case NotificationTypes.FRIEND_REQUEST_CANCELLED:
      return {
        icon: "✕",
        text: t("notif_friendRequestCancelled", { name: who }),
      };

    case NotificationTypes.FRIEND_REMOVED:
      return {
        icon: "−",
        text: t("notif_friendRemoved", { name: who }),
        link: "/chat",
      };

    case NotificationTypes.PROFILE_UPDATED:
      return {
        icon: "✎",
        text: t("notif_profileUpdated"),
        link: "/profile",
      };

    case NotificationTypes.AVATAR_UPDATED:
      return {
        icon: "✎",
        text: t("notif_avatarUpdated"),
        link: "/profile",
      };

    case NotificationTypes.MATCH_FINISHED: {
      const result = String(n.payload.result);
      const key =
        result === "WIN"
          ? "notif_matchWin"
          : result === "LOSS"
            ? "notif_matchLoss"
            : result === "DRAW"
              ? "notif_matchDraw"
              : "notif_matchAbandoned";
      return { icon: "★", text: t(key), link: "/profile" };
    }

    case NotificationTypes.TWO_FACTOR_CHANGED:
      return {
        icon: "!",
        text: t(
          n.payload.enabled
            ? "notif_twoFactorEnabled"
            : "notif_twoFactorDisabled",
        ),
        link: "/settings",
      };

    default:
      return { icon: "!", text: t("notif_default") };
  }
}