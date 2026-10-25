import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
  "rounded-lg px-3 py-2 text-sm font-medium transition " +
  "disabled:cursor-not-allowed disabled:opacity-40";

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
      throw new Error("Request timed out. Check the API gateway and chat service.");
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
          alt={`${user.username} avatar`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        user.username.slice(0, 1).toUpperCase() || "?"
      )}

    </div>
  );
}

export default function FriendsTest() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [query, setQuery] = useState("");
  const queryRef = useRef(query);
  queryRef.current = query;

  const [results, setResults] = useState<PublicUser[]>([]);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

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

  const handleSelectTab = (selectedTab: string) => {
    const routes: Record<string, string> = {
      HOME: "/home",
      PROFILE: "/profile",
      CHAT: "/chat",
      NOTIFICATION: "/notifications",
      SETTINGS: "/settings",
    };

    if (routes[selectedTab]) {
      navigate(routes[selectedTab]);
    }
  };

  // Load friends and incoming/outgoing requests.
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

        setFriends(Array.isArray(friendData) ? friendData : []);

        setRequests({
          incoming: Array.isArray(requestData?.incoming)
            ? requestData.incoming
            : [],
          outgoing: Array.isArray(requestData?.outgoing)
            ? requestData.outgoing
            : [],
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load friends data",
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [token],
  );

  // Load the users blocked by the current user.
  const refreshBlockedUsers = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest<BlockedUser[]>("/blocks", token);
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load blocked users",
      );
    }
  }, [token]);

  // Refresh the current search without requiring a browser refresh.
  const refreshSearch = useCallback(async () => {
    if (!token) return;

    const currentQuery = queryRef.current.trim();

    if (!currentQuery) {
      setResults([]);
      return;
    }

    try {
      const data = await apiRequest<PublicUser[]>(
        `/users/search?q=${encodeURIComponent(currentQuery)}`,
        token,
      );

      setResults(Array.isArray(data) ? data : []);
    } catch {
      // Keep the current results if the request temporarily fails.
    }
  }, [token]);

  useEffect(() => {
    void refreshLists();
    void refreshBlockedUsers();
  }, [refreshLists, refreshBlockedUsers]);

  // Keep the Friends page updated when actions happen in real time.
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
      };

      ws.onmessage = (message: MessageEvent) => {
        let packet: SocketPacket;

        try {
          packet = JSON.parse(message.data) as SocketPacket;
        } catch {
          return;
        }

        // Friendship or block changes.
        const eventName = packet.event ?? packet.type;
        if (
          eventName === "friend_request" ||
          eventName === "friend_accepted" ||
          eventName === "friend_removed" ||
          eventName === "block_updated"
        ) {
          void refreshLists(false);
          void refreshBlockedUsers();
          void refreshSearch();
          return;
        }

        // Online/offline status changes.
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
            !presence.status
          ) {
            return;
          }

          const online = presence.status === "online";

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

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [token, refreshLists, refreshBlockedUsers, refreshSearch]);

  // Search users.
  const searchUsers = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) return;

    if (!query.trim()) {
      setResults([]);
      setError("Enter a username to search.");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const data = await apiRequest<PublicUser[]>(
        `/users/search?q=${encodeURIComponent(query.trim())}`,
        token,
      );

      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed",
      );
    } finally {
      setSearching(false);
    }
  };

  // Run an API action, then update the lists and search results.
  const runAction = async (
    key: string,
    path: string,
    method: string,
    body?: unknown,
    successMessage = "Action completed.",
  ) => {
    if (!token) return;

    setBusyKey(key);
    setError("");
    setNotice("");

    try {
      await apiRequest(path, token, {
        method,
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(body) }),
      });

      setNotice(successMessage);

      await Promise.all([
        refreshLists(false),
        refreshBlockedUsers(),
        refreshSearch(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Action failed",
      );
    } finally {
      setBusyKey("");
    }
  };

  // Block or unblock a user.
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

      setNotice(
        shouldBlock
          ? `Blocked ${user.username}.`
          : `Unblocked ${user.username}.`,
      );

      await Promise.all([
        refreshLists(false),
        refreshBlockedUsers(),
        refreshSearch(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : shouldBlock
            ? "Could not block user"
            : "Could not unblock user",
      );
    } finally {
      setBusyKey("");
    }
  };

  // Render the appropriate action for a search result.
  const renderSearchAction = (user: PublicUser) => {
    const busy = busyKey === `user-${user.id}`;

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
              `Removed ${user.username}.`,
            )
          }
        >
          {busy ? "Working..." : "Remove"}
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
              `Accepted ${user.username}.`,
            )
          }
        >
          {busy ? "Working..." : "Accept"}
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
              "Request cancelled.",
            )
          }
        >
          {busy ? "Working..." : "Cancel"}
        </button>
      );
    }

    if (user.relation === "blocked") {
      return <span className="text-sm text-gray-500">Blocked</span>;
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
            `Request sent to ${user.username}.`,
          )
        }
      >
        {busy ? "Working..." : "Add friend"}
      </button>
    );
  };

  // Reusable row for a user.
  const renderUserRow = (
    user: PublicUser | BlockedUser,
    action?: ReactNode,
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

        {"online" in user && user.online !== undefined && (
          <p
            className={`mt-0.5 text-xs ${
              user.online ? "text-pacova-green" : "text-gray-500"
            }`}
          >
            <span className="mr-1">●</span>
            {user.online ? "Online" : "Offline"}
          </p>
        )}
      </div>

      {action}
    </div>
  );

  // Incoming friend request row.
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
          Wants to be your friend
        </p>
      </div>

      <div className="flex gap-2">
        <button
          aria-label={`Accept ${request.username}`}
          title="Accept request"
          className="rounded-lg p-2 text-pacova-green hover:bg-pacova-green/10"
          disabled={!!busyKey}
          onClick={() =>
            void runAction(
              `request-${request.id}`,
              `/friends/requests/${request.id}/accept`,
              "POST",
              undefined,
              `Accepted ${request.username}.`,
            )
          }
        >
          ✓
        </button>

        <button
          aria-label={`Decline ${request.username}`}
          title="Decline request"
          className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
          disabled={!!busyKey}
          onClick={() =>
            void runAction(
              `request-${request.id}`,
              `/friends/requests/${request.id}/decline`,
              "POST",
              undefined,
              `Declined ${request.username}.`,
            )
          }
        >
          ✕
        </button>
      </div>
    </div>
  );

  const visibleFriends = friends.filter((friend) => {
    if (tab === "online") {
      return friend.online === true;
    }

    return true;
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: friends.length },
    {
      id: "online",
      label: "Online",
      count: friends.filter((friend) => friend.online === true).length,
    },
    {
      id: "pending",
      label: "Pending",
      count: requests.incoming.length,
    },
    {
      id: "blocked",
      label: "Blocked",
      count: blockedUsers.length,
    },
  ];

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />


      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6">
        <Card variant="gray" className="flex-1">
          {/* Header */}
          <div className="p-4 sm:p-6">
            <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* <span className="text-2xl text-pacova-pink"></span> */}

                <div>
                  <h1 className="font-pixelify text-2xl text-white">
                    👤 Friends
                  </h1>

                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                    Connect, play, and chat together.
                  </p>
                </div>
              </div>

              <form
                onSubmit={searchUsers}
                className="flex w-full gap-2 sm:w-auto"
              >
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search friends..."
                  aria-label="Search friends"
                  className="min-w-0 flex-1 rounded-lg border
                    border-white/10 bg-[#171120] px-3 py-2
                    text-sm text-white outline-none
                    placeholder:text-gray-500
                    focus:border-pacova-green/30 sm:w-48"
                />

                <button
                  type="submit"
                  aria-label="Search users"
                  className="rounded-lg bg-white/[0.06] px-3
                    text-gray-300 hover:bg-white/10"
                  disabled={searching}
                >
                  {searching ? "..." : "🔍︎"}
                </button>
              </form>
              </div>
              
              {/* Search results */}
          
          {results.length > 0 && (
            <div className="my-4 rounded-lg border border-pacova-pink/20">
              <div className="px-3 pt-2 text-xs font-semibold text-pacova-pink">
                SEARCH RESULTS
              </div>

              {results.map((user) =>
                renderUserRow(
                  user,
                  <div className="flex shrink-0 items-center gap-2">
                    {renderSearchAction(user)}

                    {user.relation !== "self" &&
                      user.relation !== "blocked" && (
                        <button
                          className={dangerButton}
                          disabled={!!busyKey}
                          onClick={() => void toggleBlock(user, true)}
                        >
                          {busyKey === `block-${user.id}`
                            ? "Blocking..."
                            : "Block"}
                        </button>
                      )}

                    {user.relation === "blocked" && (
                      <button
                        className={greenButton}
                        disabled={!!busyKey}
                        onClick={() => void toggleBlock(user, false)}
                      >
                        {busyKey === `block-${user.id}`
                          ? "Unblocking..."
                          : "Unblock"}
                      </button>
                    )}
                  </div>,
                ),
              )}
            </div>
          )}
            </div>

  
            

            {/* Tabs */}
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
                    <span className="ml-2 opacity-70">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
                      
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mx-4 mb-3 rounded-lg border border-red-500/30
                bg-red-950/20 px-3 py-2 text-sm text-red-300 sm:mx-6"
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {notice && (
            <div
              role="status"
              className="mx-4 mb-3 rounded-lg border border-pacova-green/20
                bg-pacova-green/5 px-3 py-2 text-sm text-pacova-green sm:mx-6"
            >
              {notice}
            </div>
          )}



          {/* Main list */}
          <div
            className="mx-4 mb-5 overflow-hidden rounded-lg border
              border-white/[0.07] sm:mx-6"
          >
            {loading ? (
              <p className="py-10 text-center text-sm text-pacova-pink">
                Loading friends...
              </p>
            ) : tab === "pending" ? (
              requests.incoming.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">
                  No pending requests.
                </p>
              ) : (
                requests.incoming.map(renderRequestRow)
              )
            ) : tab === "blocked" ? (
              blockedUsers.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-500">
                  You have not blocked anyone.
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
                        ? "Unblocking..."
                        : "Unblock"}
                    </button>,
                  ),
                )
              )
            ) : visibleFriends.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">
                {tab === "online"
                  ? "No friends online right now."
                  : "No friends yet. Search a username to get started."}
              </p>
            ) : (
              visibleFriends.map((friend) =>
                renderUserRow(
                  friend,
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      title={`Chat with ${friend.username}`}
                      aria-label={`Chat with ${friend.username}`}
                      className="rounded-lg bg-white/[0.05] px-3 py-2
                        text-sm text-gray-300 hover:bg-white/10"
                      onClick={() => navigate("/chat")}
                    >
                      💬
                    </button>

                    <button
                      title={`Block ${friend.username}`}
                      aria-label={`Block ${friend.username}`}
                      className="rounded-lg px-2 py-2 text-red-400
                        hover:bg-red-500/10"
                      disabled={!!busyKey}
                      onClick={() => void toggleBlock(friend, true)}
                    >
                      {busyKey === `block-${friend.id}`
                        ? "Blocking..."
                        : "Block"}
                    </button>

                    <button
                      title={`Remove ${friend.username}`}
                      aria-label={`Remove ${friend.username}`}
                      className="rounded-lg px-2 py-2 text-gray-500
                        hover:bg-red-500/10 hover:text-red-400"
                      disabled={!!busyKey}
                      onClick={() =>
                        void runAction(
                          `friend-${friend.id}`,
                          `/friends/${friend.id}`,
                          "DELETE",
                          undefined,
                          `Removed ${friend.username}.`,
                        )
                      }
                    >
                      Remove
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