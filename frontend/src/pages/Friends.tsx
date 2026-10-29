import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";


type Relation =
  | "self"
  | "friend"
  | "incoming_request"
  | "outgoing_request"
  | "blocked"
  | "none";

type PublicUser = {
  id: number;
  username: string;
  avatar?: string | null;
  online?: boolean;
  relation?: Relation;
};

type FriendRequest = {
  id: string;
  userId: number;
  username: string;
  avatar?: string | null;
  createdAt?: string;
};

type BlockedUser = {
  id: number;
  username: string;
  avatar?: string | null;
};

type BlockStatus = {
  iBlockedThem: boolean;
  theyBlockedMe: boolean;
};

type RequestLists = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

type Tab = "all" | "online" | "pending" | "blocked";

type SocketPacket = {
  event?: string;
  type?: string;
  data?: unknown;
};

const API = "/api/chat";

const buttonClass =
  "rounded-lg px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm " +
  "font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

const primaryButton =
  `${buttonClass} bg-pacova-pink text-white hover:brightness-110`;

const greenButton =
  `${buttonClass} bg-pacova-green text-[#0D0914] hover:brightness-110`;

const dangerButton =
  `${buttonClass} border border-red-500/40 text-red-400 hover:bg-red-500/10`;

async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;

  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Request timed out. Check the API gateway and chat service.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : `Request failed (${response.status})`;

    throw new Error(`${response.status}: ${message}`);
  }

  return data as T;
}

function UserAvatar({
  user,
}: {
  user: Pick<PublicUser, "username" | "avatar" | "online">;
}) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center
        overflow-hidden rounded-full border-2
        ${user.online ? "border-pacova-green" : "border-pacova-gray/50"}
        bg-[#211027] font-pixelify text-lg text-pacova-pink`}
    >
      {user.avatar && !imageFailed ? (
        <img
          src={user.avatar}
          alt={t("friends_avatarAlt", { username: user.username })}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        user.username.slice(0, 1).toUpperCase() || "?"
      )}
    </div>
  );
}

export default function Friends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  const livePresenceRef = useRef<Record<number, boolean>>({});
  queryRef.current = query;

  const [results, setResults] = useState<PublicUser[]>([]);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockStatuses, setBlockStatuses] = useState<
    Record<number, BlockStatus>
  >({});
  const [requests, setRequests] = useState<RequestLists>({
    incoming: [],
    outgoing: [],
  });

  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!error && !notice) return;

    const timer = setTimeout(() => {
      setError("");
      setNotice("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error, notice]);

  const handleSelectTab = (selectedTab: string) => {
    const routes: Record<string, string> = {
      HOME: "/home",
      PROFILE: "/profile",
      CHAT: "/chat",
      NOTIFICATION: "/notifications",
      SETTINGS: "/settings",
      LEADERBOARD: "/leaderboard",
    };

    if (routes[selectedTab]) {
      navigate(routes[selectedTab]);
    }
  };

  const refreshLists = useCallback(
    async (showLoading = true) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (showLoading) setLoading(true);

      try {
        const [friendData, requestData] = await Promise.all([
          apiRequest<PublicUser[]>("/friends", token),
          apiRequest<RequestLists>("/friends/requests", token),
        ]);

        setFriends(
          Array.isArray(friendData)
            ? friendData.map((friend) =>
                livePresenceRef.current[friend.id] !== undefined
                  ? {
                      ...friend,
                      online: livePresenceRef.current[friend.id],
                    }
                  : friend,
              )
            : [],
        );

        setRequests({
          incoming: Array.isArray(requestData?.incoming)
            ? requestData.incoming
            : [],
          outgoing: Array.isArray(requestData?.outgoing)
            ? requestData.outgoing
            : [],
        });
      } catch {
        setError(t("friends_errors_loadFriends"));
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [token, t],
  );

  const refreshBlockedUsers = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest<BlockedUser[]>("/blocks", token);
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch {
      setError(t("friends_errors_loadBlockedUsers"));
    }
  }, [token, t]);

  const refreshBlockStatuses = useCallback(
    async (users: PublicUser[]) => {
      if (!token) return;

      const entries = await Promise.all(
        users
          .filter((user) => user.relation !== "self")
          .map(async (user) => {
            try {
              const status = await apiRequest<BlockStatus>(
                `/blocks/status/${user.id}`,
                token,
              );

              return [user.id, status] as const;
            } catch {
              return null;
            }
          }),
      );

      const statuses: Record<number, BlockStatus> = {};

      for (const entry of entries) {
        if (entry) statuses[entry[0]] = entry[1];
      }

      setBlockStatuses(statuses);
    },
    [token],
  );

  const refreshSearch = useCallback(async () => {
    if (!token) return;

    const currentQuery = queryRef.current.trim();

    if (!currentQuery) {
      setResults([]);
      setBlockStatuses({});
      return;
    }

    try {
      const data = await apiRequest<PublicUser[]>(
        `/users/search?q=${encodeURIComponent(currentQuery)}`,
        token,
      );

      const users = Array.isArray(data) ? data : [];
      setResults(users);
      void refreshBlockStatuses(users);
    } catch {
      // Keep current results if the request temporarily fails.
    }
  }, [token, refreshBlockStatuses]);

  useEffect(() => {
    void refreshLists();
    void refreshBlockedUsers();
  }, [refreshLists, refreshBlockedUsers]);

  useEffect(() => {
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = 1000;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      const protocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";

      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`,
      );

      socket = ws;

      ws.onopen = () => {
        reconnectDelay = 1000;
        livePresenceRef.current = {};
        void refreshLists(false);
      };

      ws.onmessage = (message: MessageEvent) => {
        let packet: SocketPacket;

        try {
          packet = JSON.parse(message.data) as SocketPacket;
        } catch {
          return;
        }

        const eventName = packet.event ?? packet.type;

        if (
          [
            "friend_request",
            "friend_request_cancelled",
            "friend_request_declined",
            "friend_accepted",
            "friend_removed",
          ].includes(eventName ?? "")
        ) {
          void refreshLists(false);
          void refreshSearch();
          return;
        }

        if (eventName === "block_updated") {
          void refreshLists(false);
          void refreshBlockedUsers();
          void refreshSearch();
          return;
        }

        if (
          packet.event === "presence" &&
          packet.data &&
          typeof packet.data === "object"
        ) {
          const presence = packet.data as {
            user_id?: number;
            status?: "online" | "offline";
          };

          if (
            typeof presence.user_id !== "number" ||
            (presence.status !== "online" &&
              presence.status !== "offline")
          ) {
            return;
          }

          const online = presence.status === "online";
          livePresenceRef.current[presence.user_id] = online;

          setFriends((current) =>
            current.map((friend) =>
              friend.id === presence.user_id
                ? { ...friend, online }
                : friend,
            ),
          );

          setResults((current) =>
            current.map((user) =>
              user.id === presence.user_id
                ? { ...user, online }
                : user,
            ),
          );
        }
      };

      ws.onclose = () => {
        if (disposed) return;

        reconnectTimer = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
          connect();
        }, reconnectDelay);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [token, refreshLists, refreshBlockedUsers, refreshSearch]);

  const searchUsers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

    if (!query.trim()) {
      setResults([]);
      setBlockStatuses({});
      setError(t("friends_errors_enterUsername"));
      return;
    }

    setSearching(true);
    setError("");

    try {
      const data = await apiRequest<PublicUser[]>(
        `/users/search?q=${encodeURIComponent(query.trim())}`,
        token,
      );

      const users = Array.isArray(data) ? data : [];
      setResults(users);
      void refreshBlockStatuses(users);
    } catch {
      setError(t("friends_errors_searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  const runAction = async (
    key: string,
    path: string,
    method: string,
    body?: unknown,
    successMessage = t("friends_messages_actionCompleted"),
  ) => {
    if (!token) return;

    setBusyKey(key);
    setError("");
    setNotice("");

    try {
      await apiRequest(path, token, {
        method,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

      setNotice(successMessage);

      await Promise.all([
        refreshLists(false),
        refreshBlockedUsers(),
        refreshSearch(),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";

      if (
        path.startsWith("/friends/requests/") &&
        /404|not found/i.test(message)
      ) {
        await Promise.all([refreshLists(false), refreshSearch()]);
        setError("");
        setNotice(
          t("friends_messages_requestNoLongerPending"),
        );
      } else {
        setError(t("friends_errors_actionFailed"));
      }
    } finally {
      setBusyKey("");
    }
  };

  const toggleBlock = async (
    user: PublicUser | BlockedUser,
    shouldBlock: boolean,
  ) => {
    if (!token) return;

    setBusyKey(`block-${user.id}`);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/blocks/${user.id}`, token, {
        method: shouldBlock ? "POST" : "DELETE",
      });

      let successMessage = shouldBlock
        ? t("friends_messages_blocked", { username: user.username })
        : t("friends_messages_unblocked", { username: user.username });

      if (!shouldBlock) {
        try {
          const status = await apiRequest<BlockStatus>(
            `/blocks/status/${user.id}`,
            token,
          );

          setBlockStatuses((current) => ({
            ...current,
            [user.id]: status,
          }));

          if (status.theyBlockedMe) {
            successMessage =
              t("friends_messages_unblockedButStillBlocked", { username: user.username });
          }
        } catch {
          // The unblock succeeded; refresh will retry fetching the status.
        }
      } else {
        setBlockStatuses((current) => ({
          ...current,
          [user.id]: {
            iBlockedThem: true,
            theyBlockedMe: current[user.id]?.theyBlockedMe ?? false,
          },
        }));
      }

      setNotice(successMessage);

      await Promise.all([
        refreshLists(false),
        refreshBlockedUsers(),
        refreshSearch(),
      ]);
    } catch {
      setError(
        shouldBlock
          ? t("friends_errors_blockFailed")
          : t("friends_errors_unblockFailed"),
      );
    } finally {
      setBusyKey("");
    }
  };

  const renderSearchAction = (user: PublicUser) => {
    const busy = busyKey === `user-${user.id}`;
    const blockStatus = blockStatuses[user.id];

    if (
      blockStatus?.iBlockedThem ||
      blockStatus?.theyBlockedMe ||
      user.relation === "blocked"
    ) {
      if (blockStatus?.iBlockedThem) {
        return (
          <button
            className={greenButton}
            disabled={!!busyKey}
            onClick={() => void toggleBlock(user, false)}
          >
            {busyKey === `block-${user.id}` ? t("friends_buttons_unblocking") : t("friends_buttons_unblock")}
          </button>
        );
      }

      return <span className="text-sm text-gray-500">{t("friend_tabs_blocked")}</span>;
    }

    if (user.relation === "self") return null;

    if (user.relation === "friend") {
      return (
        <button
          className={dangerButton}
          disabled={!!busyKey}
          onClick={() =>
            void runAction(
              `user-${user.id}`,
              `/friends/${user.id}`,
              "DELETE",
              undefined,
              t("friends_messages_removed", { username: user.username }),
            )
          }
        >
          {busy ? t("friends_buttons_working") : t("friends_buttons_remove")}
        </button>
      );
    }

    if (user.relation === "incoming_request") {
      const request = requests.incoming.find(
        (item) => item.userId === user.id,
      );

      return (
        <button
          className={greenButton}
          disabled={!!busyKey || !request}
          onClick={() =>
            request &&
            void runAction(
              `user-${user.id}`,
              `/friends/requests/${request.id}/accept`,
              "POST",
              undefined,
              t("friends_messages_accepted", { username: user.username }),
            )
          }
        >
          {busy ? t("friends_buttons_working") : t("friends_buttons_accept")}
        </button>
      );
    }

    if (user.relation === "outgoing_request") {
      const request = requests.outgoing.find(
        (item) => item.userId === user.id,
      );

      return (
        <button
          className={dangerButton}
          disabled={!!busyKey || !request}
          onClick={() =>
            request &&
            void runAction(
              `user-${user.id}`,
              `/friends/requests/${request.id}`,
              "DELETE",
              undefined,
              t("friends_messages_cancelled"),
            )
          }
        >
          {busy ? t("friends_buttons_working") : t("friends_buttons_cancel")}
        </button>
      );
    }

    return (
      <button
        className={primaryButton}
        disabled={!!busyKey}
        onClick={() =>
          void runAction(
            `user-${user.id}`,
            "/friends/requests",
            "POST",
            { userId: user.id },
            t("friends_messages_invitationSent", { username: user.username }),
          )
        }
      >
        {busy ? t("friends_buttons_working") : t("friends_buttons_addFriend")}
      </button>
    );
  };

  const renderUserRow = (
    user: PublicUser | BlockedUser,
    action?: ReactNode,
    showPresence = true,
  ) => (
    <div
      key={user.id}
      className="flex min-w-0 items-center gap-3 border-b
        border-white/[0.06] px-3 py-3 last:border-b-0
        hover:bg-white/[0.025]"
    >
      <UserAvatar user={user} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user.username}
        </p>

        {showPresence && "online" in user && user.online !== undefined && (
          <p
            className={`mt-0.5 text-xs ${
              user.online ? "text-pacova-green" : "text-gray-500"
            }`}
          >
            <span className="mr-1">●</span>
            {user.online ? t("friends_status_online") : t("friends_status_offline")}
          </p>
        )}
      </div>

      {action}
    </div>
  );

  const renderRequestRow = (request: FriendRequest) => (
    <div
      key={request.id}
      className="flex min-w-0 items-center gap-3 border-b
        border-white/[0.06] px-3 py-3 last:border-b-0"
    >
      <UserAvatar user={request} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {request.username}
        </p>

        <p className="mt-0.5 text-xs text-gray-500">
          {t("friends_requests_wantsToBeFriend")}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          aria-label={t("friends_requests_acceptAriaLabel", { username: request.username })}
          title={t("friends_requests_acceptTitle")}
          className="rounded-lg p-2 text-pacova-green hover:bg-pacova-green/10"
          disabled={!!busyKey}
          onClick={() =>
            void runAction(
              `request-${request.id}`,
              `/friends/requests/${request.id}/accept`,
              "POST",
              undefined,
              t("friends_messages_accepted", { username: request.username }),
            )
          }
        >
          ✓
        </button>

        <button
          aria-label={t("friends_requests_declineAriaLabel", { username: request.username })}
          title={t("friends_requests_declineTitle")}
          className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
          disabled={!!busyKey}
          onClick={() =>
            void runAction(
              `request-${request.id}`,
              `/friends/requests/${request.id}/decline`,
              "POST",
              undefined,
              t("friends_messages_declined", { username: request.username }),
            )
          }
        >
          ✕
        </button>
      </div>
    </div>
  );

  const visibleFriends = friends.filter(
    (friend) => tab !== "online" || friend.online === true,
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: t("friends_tabs_all"), count: friends.length },
    {
      id: "online",
      label: t("friends_tabs_online"),
      count: friends.filter((friend) => friend.online === true).length,
    },
    { id: "pending", label: t("friends_tabs_pending"), count: requests.incoming.length },
    { id: "blocked", label: t("friends_tabs_blocked"), count: blockedUsers.length },
  ];

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={handleSelectTab} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6">
        <Card variant="gray" className="flex-1">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-pixelify text-2xl text-white">
                  👤 {t("friends_title")}
                </h1>

                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  {t("friends_subtitle")}
                </p>
              </div>

              <form
                onSubmit={searchUsers}
                className="flex w-full gap-2 sm:w-auto"
              >
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("friends_searchPlaceholder")}
                  aria-label={t("friends_searchAriaLabel")}
                  className="min-w-0 flex-1 rounded-lg border
                    border-white/10 bg-[#171120] px-3 py-2
                    text-sm text-white outline-none
                    placeholder:text-gray-500
                    focus:border-pacova-green/30 sm:w-48"
                />

                <button
                  type="submit"
                  aria-label={t("friends_searchButtonAriaLabel")}
                  className="rounded-lg bg-white/[0.06] px-3
                    text-gray-300 hover:bg-white/10"
                  disabled={searching}
                >
                  {searching ? "..." : "🔍︎"}
                </button>
              </form>
            </div>

            {results.length > 0 && (
              <div className="my-4 rounded-lg border border-pacova-pink/20">
                <div className="px-3 pt-2 text-xs font-semibold text-pacova-pink">
                  {t("friends_searchResults")}
                </div>

                {results.map((user) =>
                  renderUserRow(
                    user,
                    <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
                      {renderSearchAction(user)}
                    </div>,
                    false,
                  ),
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`rounded-lg px-4 py-2 text-xs
                    font-medium transition sm:text-sm ${
                      tab === item.id
                        ? "bg-pacova-pink text-white"
                        : "bg-white/[0.045] text-gray-400 hover:bg-white/[0.08]"
                    }`}
                >
                  {item.label}

                  {item.count !== undefined && (
                    <span className="ml-2 opacity-70">{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-4 mb-3 rounded-lg border border-red-500/30
                bg-red-950/20 px-3 py-2 text-sm text-red-300 sm:mx-6"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="mx-4 mb-3 rounded-lg border border-pacova-green/20
                bg-pacova-green/5 px-3 py-2 text-sm text-pacova-green sm:mx-6"
            >
              {notice}
            </div>
          )}

          <div className="mx-4 mb-5 rounded-lg border border-white/[0.07] sm:mx-6">
            {loading ? (
              <p className="py-10 text-center text-sm text-pacova-pink">
                {t("friends_loading")}
              </p>
            ) : tab === "pending" ? (
              requests.incoming.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">
                  {t("friends_empty_pending")}
                </p>
              ) : (
                requests.incoming.map(renderRequestRow)
              )
            ) : tab === "blocked" ? (
              blockedUsers.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">
                  {t("friends_empty_blocked")}
                </p>
              ) : (
                blockedUsers.map((user) =>
                  renderUserRow(
                    user,
                    <button
                      className={greenButton}
                      disabled={!!busyKey}
                      onClick={() => void toggleBlock(user, false)}
                    >
                      {busyKey === `block-${user.id}`
                        ? t("friends_buttons_unblocking")
                        : t("friends_buttons_unblock")}
                    </button>,
                  ),
                )
              )
            ) : visibleFriends.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">
                {tab === "online"
                  ? t("friends_empty_online")
                  : t("friends_empty_friends")}
              </p>
            ) : (
              visibleFriends.map((friend) =>
                renderUserRow(
                  friend,
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      title={t("friends_actions_chatWith", { username: friend.username })}
                      aria-label={t("friends_actions_chatWith", { username: friend.username })}
                      className="rounded-lg p-2 text-gray-300 hover:bg-white/10 sm:px-3 sm:py-2 sm:text-sm"
                      onClick={() => navigate("/chat")}
                    >
                      💬
                    </button>

                    <button
                      title={t("friends_actions_blockUser", { username: friend.username })}
                      aria-label={t("friends_actions_blockUser", { username: friend.username })}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 sm:px-2 sm:py-2 sm:text-sm"
                      disabled={!!busyKey}
                      onClick={() => void toggleBlock(friend, true)}
                    >
                      <span className="sm:hidden">🚫</span>
                      <span className="hidden sm:inline">
                        {busyKey === `block-${friend.id}`
                          ? t("friends_buttons_blocking")
                          : t("friends_buttons_block")}
                      </span>
                    </button>

                    <button
                      title={t("friends_actions_removeUser", { username: friend.username })}
                      aria-label={t("friends_actions_removeUser", { username: friend.username })}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 sm:px-2 sm:py-2 sm:text-sm"
                      disabled={!!busyKey}
                      onClick={() =>
                        void runAction(
                          `friend-${friend.id}`,
                          `/friends/${friend.id}`,
                          "DELETE",
                          undefined,
                          t("friends_messages_removed", { username: friend.username }),
                        )
                      }
                    >
                      <span className="sm:hidden">➖</span>
                      <span className="hidden sm:inline">{t("friends_buttons_remove")}</span>
                    </button>
                  </div>,
                ),
              )
            )}
          </div>
        </Card>
      </main>
    </Background>
  );
}