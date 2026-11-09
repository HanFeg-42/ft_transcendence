import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

type Relation = "self" | "friend" | "incoming_request" | "outgoing_request" | "blocked" | "none";
type User = { id: number; username: string; avatar?: string | null; online?: boolean; relation?: Relation };
type Req = { id: string; userId: number; username: string; avatar?: string | null };
type BlockStatus = { iBlockedThem: boolean; theyBlockedMe: boolean };
type Tab = "all" | "online" | "pending" | "blocked";
type Msg = { kind: "error" | "notice"; text: string } | null;

const API = "/api/chat";
const ROUTES: Record<string, string> = {
  HOME: "/home", PROFILE: "/profile", CHAT: "/chat",
  NOTIFICATION: "/notifications", SETTINGS: "/settings", LEADERBOARD: "/leaderboard",
};
const SOCKET_REFRESH = ["friend_request", "friend_request_cancelled", "friend_request_declined",
                        "friend_accepted", "friend_removed"];

const btn = (color: string) =>
  `rounded-lg px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-medium
    transition disabled:cursor-not-allowed disabled:opacity-40 ${color}`;
const primary = btn("bg-pacova-pink text-white hover:brightness-110");
const green = btn("bg-pacova-green text-[#0D0914] hover:brightness-110");
const danger = btn("border border-red-500/40 text-red-400 hover:bg-red-500/10");
const iconBtn = "rounded-lg p-2 sm:px-2 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.error ?? "Request failed"}`);
  return data as T;
}

function Avatar({ user }: { user: Pick<User, "username" | "avatar" | "online"> }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-[#211027] font-pixelify text-lg text-pacova-pink ${
        user.online ? "border-pacova-green" : "border-pacova-gray/50"
      }`}
    >
      {user.avatar && !failed ? (
        <img
          src={user.avatar}
          alt={t("friends_avatarAlt", { username: user.username })}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
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
  queryRef.current = query;
  const presence = useRef<Record<number, boolean>>({});

  const [results, setResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [blocked, setBlocked] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<Record<number, BlockStatus>>({});
  const [requests, setRequests] = useState<{ incoming: Req[]; outgoing: Req[] }>({ incoming: [], outgoing: [] });
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    initialTab === "pending" || initialTab === "online" || initialTab === "blocked"
      ? initialTab
      : "all",
  );
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

  const fail = (text: string) => setMsg({ kind: "error", text });
  const call = useCallback(<T,>(path: string, init?: RequestInit) => api<T>(path, token!, init), [token]);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(id);
  }, [msg]);

  const loadLists = useCallback(
    async (showLoading = true) => {
      if (!token) return setLoading(false);
      if (showLoading) setLoading(true);
      try {
        const [f, r] = await Promise.all([
          call<User[]>("/friends"),
          call<{ incoming: Req[]; outgoing: Req[] }>("/friends/requests"),
        ]);
        setFriends(arr<User>(f).map((u) => (presence.current[u.id] !== undefined ? { ...u, online: presence.current[u.id] } : u)));
        setRequests({ incoming: arr(r?.incoming), outgoing: arr(r?.outgoing) });
      } catch {
        fail(t("friends_errors_loadFriends"));
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [token, call, t],
  );

  const loadBlocked = useCallback(async () => {
    if (!token) return;
    try {
      setBlocked(arr(await call<User[]>("/blocks")));
    } catch {
      fail(t("friends_errors_loadBlockedUsers"));
    }
  }, [token, call, t]);

  // Throws on failure; callers decide whether to show an error.
  const search = useCallback(async () => {
    if (!token) return;
    const q = queryRef.current.trim();
    if (!q) {
      setResults([]);
      setStatuses({});
      return;
    }
    const users = arr<User>(await call<User[]>(`/users/search?q=${encodeURIComponent(q)}`));
    setResults(users);
    const entries = await Promise.all(
      users
        .filter((u) => u.relation !== "self")
        .map((u) => call<BlockStatus>(`/blocks/status/${u.id}`).then((s) => [u.id, s] as const).catch(() => null)),
    );
    setStatuses(Object.fromEntries(entries.filter((e): e is readonly [number, BlockStatus] => !!e)));
  }, [token, call]);

  const refreshAll = useCallback(
    () => Promise.all([loadLists(false), loadBlocked(), search().catch(() => {})]),
    [loadLists, loadBlocked, search],
  );

  useEffect(() => {
    void loadLists();
    void loadBlocked();
  }, [loadLists, loadBlocked]);

  useEffect(() => {
    if (!token) return;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}/api/chat/ws?token=${encodeURIComponent(token)}`);

      ws.onopen = () => {
        delay = 1000;
        presence.current = {};
        void loadLists(false);
      };

      ws.onmessage = (m: MessageEvent) => {
        let p: { event?: string; type?: string; data?: any };
        try {
          p = JSON.parse(m.data);
        } catch {
          return;
        }
        const name = p.event ?? p.type ?? "";
        if (SOCKET_REFRESH.includes(name) || name === "block_updated") {
          void loadLists(false);
          void search().catch(() => {});
          if (name === "block_updated") void loadBlocked();
          return;
        }
        if (p.event === "presence" && p.data && typeof p.data === "object") {
          const { user_id, status } = p.data;
          if (typeof user_id !== "number" || (status !== "online" && status !== "offline")) return;
          const online = status === "online";
          presence.current[user_id] = online;
          const patch = (list: User[]) => list.map((u) => (u.id === user_id ? { ...u, online } : u));
          setFriends(patch);
          setResults(patch);
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        timer = setTimeout(() => {
          delay = Math.min(delay * 2, 30000);
          connect();
        }, delay);
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [token, loadLists, loadBlocked, search]);

  const submitSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!query.trim()) {
      setResults([]);
      setStatuses({});
      return fail(t("friends_errors_enterUsername"));
    }
    setSearching(true);
    setMsg(null);
    try {
      await search();
    } catch {
      fail(t("friends_errors_searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  // Shared runner: busy flag, notice/error, then refresh everything.
  const run = async (key: string, task: () => Promise<string>, errorText: string) => {
    if (!token) return;
    setBusy(key);
    setMsg(null);
    try {
      setMsg({ kind: "notice", text: await task() });
      await refreshAll();
    } catch {
      fail(errorText);
    } finally {
      setBusy("");
    }
  };

  const act = (key: string, path: string, method: string, ok: string, body?: unknown) =>
    run(
      key,
      async () => {
        try {
          await call(path, { method, body: body ? JSON.stringify(body) : undefined });
          return ok;
        } catch (e) {
          if (path.startsWith("/friends/requests/") && /404|not found/i.test(String(e)))
            return t("friends_messages_requestNoLongerPending");
          throw e;
        }
      },
      t("friends_errors_actionFailed"),
    );

  const toggleBlock = (u: User, block: boolean) =>
    run(
      `block-${u.id}`,
      async () => {
        await call(`/blocks/${u.id}`, { method: block ? "POST" : "DELETE" });
        const status = await call<BlockStatus>(`/blocks/status/${u.id}`).catch(() => null);
        if (status) setStatuses((c) => ({ ...c, [u.id]: status }));
        const p = { username: u.username };
        if (!block && status?.theyBlockedMe) return t("friends_messages_unblockedButStillBlocked", p);
        return t(block ? "friends_messages_blocked" : "friends_messages_unblocked", p);
      },
      t(block ? "friends_errors_blockFailed" : "friends_errors_unblockFailed"),
    );

  const unblockBtn = (u: User) => (
    <button className={green} disabled={!!busy} onClick={() => void toggleBlock(u, false)}>
      {busy === `block-${u.id}` ? t("friends_buttons_unblocking") : t("friends_buttons_unblock")}
    </button>
  );

  const searchAction = (u: User) => {
    if (u.relation === "self") return null;
    const s = statuses[u.id];
    if (s?.iBlockedThem) return unblockBtn(u);
    if (s?.theyBlockedMe || u.relation === "blocked")
      return <span className="text-sm text-gray-500">{t("friend_tabs_blocked")}</span>;

    const p = { username: u.username };
    const key = `user-${u.id}`;
    const req =
      u.relation === "incoming_request"
        ? requests.incoming.find((r) => r.userId === u.id)
        : u.relation === "outgoing_request"
          ? requests.outgoing.find((r) => r.userId === u.id)
          : undefined;
    const needsReq = u.relation === "incoming_request" || u.relation === "outgoing_request";

    // [class, path, method, success message, label key, body]
    const cfg: Record<string, [string, string, string, string, string, unknown?]> = {
      friend: [danger, `/friends/${u.id}`, "DELETE", t("friends_messages_removed", p), "remove"],
      incoming_request: [green, `/friends/requests/${req?.id}/accept`, "POST", t("friends_messages_accepted", p), "accept"],
      outgoing_request: [danger, `/friends/requests/${req?.id}`, "DELETE", t("friends_messages_cancelled"), "cancel"],
    };
    const [cls, path, method, ok, label, body] =
      cfg[u.relation ?? ""] ?? [primary, "/friends/requests", "POST", t("friends_messages_invitationSent", p), "addFriend", { userId: u.id }];

    return (
      <button
        className={cls}
        disabled={!!busy || (needsReq && !req)}
        onClick={() => void act(key, path, method, ok, body)}
      >
        {busy === key ? t("friends_buttons_working") : t(`friends_buttons_${label}`)}
      </button>
    );
  };

  const userRow = (u: User, action?: ReactNode, showPresence = true) => (
    <div key={u.id} className="flex min-w-0 items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0 hover:bg-white/[0.025]">
      <Avatar user={u} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{u.username}</p>
        {showPresence && u.online !== undefined && (
          <p className={`mt-0.5 text-xs ${u.online ? "text-pacova-green" : "text-gray-500"}`}>
            <span className="mr-1">●</span>
            {u.online ? t("friends_status_online") : t("friends_status_offline")}
          </p>
        )}
      </div>
      {action}
    </div>
  );

  const requestRow = (r: Req) => {
    const p = { username: r.username };
    const decide = (path: "accept" | "decline", msgKey: string) =>
      void act(`request-${r.id}`, `/friends/requests/${r.id}/${path}`, "POST", t(msgKey, p));
    return (
      <div key={r.id} className="flex min-w-0 items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0">
        <Avatar user={r} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{r.username}</p>
          <p className="mt-0.5 text-xs text-gray-500">{t("friends_requests_wantsToBeFriend")}</p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label={t("friends_requests_acceptAriaLabel", p)}
            title={t("friends_requests_acceptTitle")}
            className="rounded-lg p-2 text-pacova-green hover:bg-pacova-green/10"
            disabled={!!busy}
            onClick={() => decide("accept", "friends_messages_accepted")}
          >
            ✓
          </button>
          <button
            aria-label={t("friends_requests_declineAriaLabel", p)}
            title={t("friends_requests_declineTitle")}
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            disabled={!!busy}
            onClick={() => decide("decline", "friends_messages_declined")}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const friendRow = (f: User) => {
    const p = { username: f.username };
    const isBlocked = blocked.some((b) => b.id === f.id);
    return userRow(
      f,
      <div className="flex shrink-0 items-center gap-1">
        <button
          title={t("friends_actions_chatWith", p)}
          aria-label={t("friends_actions_chatWith", p)}
          className={`${iconBtn} text-gray-300 hover:bg-white/10`}
          onClick={() => navigate("/chat")}
        >
          💬
        </button>
        <button
          title={t("friends_actions_blockUser", p)}
          aria-label={t("friends_actions_blockUser", p)}
          className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
          disabled={!!busy || isBlocked }
          onClick={() => void toggleBlock(f, true)}
        >
          <span className="sm:hidden">🚫</span>
          <span className="hidden sm:inline">
            {busy === `block-${f.id}` ? t("friends_buttons_blocking") : t("friends_buttons_block")}
          </span>
        </button>
        <button
          title={t("friends_actions_removeUser", p)}
          aria-label={t("friends_actions_removeUser", p)}
          className={`${iconBtn} text-gray-400 hover:bg-red-500/10 hover:text-red-400`}
          disabled={!!busy}
          onClick={() => void act(`friend-${f.id}`, `/friends/${f.id}`, "DELETE", t("friends_messages_removed", p))}
        >
          <span className="sm:hidden">➖</span>
          <span className="hidden sm:inline">{t("friends_buttons_remove")}</span>
        </button>
      </div>,
    );
  };

  const list = <T,>(items: T[], emptyKey: string, row: (i: T) => ReactNode) =>
    items.length ? (
      items.map(row)
    ) : (
      <p className="px-4 py-10 text-center text-sm text-gray-500">{t(emptyKey)}</p>
    );

  const onlineFriends = friends.filter((f) => f.online === true);
  const tabs: [Tab, number][] = [
    ["all", friends.length],
    ["online", onlineFriends.length],
    ["pending", requests.incoming.length],
    ["blocked", blocked.length],
  ];

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={(s: string) => ROUTES[s] && navigate(ROUTES[s])} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6">
        <Card variant="gray" className="flex-1">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-pixelify text-2xl text-white">👤 {t("friends_title")}</h1>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">{t("friends_subtitle")}</p>
              </div>

              <form onSubmit={submitSearch} className="flex w-full gap-2 sm:w-auto">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("friends_searchPlaceholder")}
                  aria-label={t("friends_searchAriaLabel")}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#171120] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-pacova-green/30 sm:w-48"
                />
                <button
                  type="submit"
                  aria-label={t("friends_searchButtonAriaLabel")}
                  className="rounded-lg bg-white/[0.06] px-3 text-gray-300 hover:bg-white/10"
                  disabled={searching}
                >
                  {searching ? "..." : "🔍︎"}
                </button>
              </form>
            </div>

            {results.length > 0 && (
              <div className="my-4 rounded-lg border border-pacova-pink/20">
                <div className="px-3 pt-2 text-xs font-semibold text-pacova-pink">{t("friends_searchResults")}</div>
                {results.map((u) =>
                  userRow(
                    u,
                    <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">{searchAction(u)}</div>,
                    false,
                  ),
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map(([id, count]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition sm:text-sm ${
                    tab === id ? "bg-pacova-pink text-white" : "bg-white/[0.045] text-gray-400 hover:bg-white/[0.08]"
                  }`}
                >
                  {t(`friends_tabs_${id}`)}
                  <span className="ml-2 opacity-70">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <div
              role={msg.kind === "error" ? "alert" : "status"}
              className={`mx-4 mb-3 rounded-lg border px-3 py-2 text-sm sm:mx-6 ${
                msg.kind === "error"
                  ? "border-red-500/30 bg-red-950/20 text-red-300"
                  : "border-pacova-green/20 bg-pacova-green/5 text-pacova-green"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="mx-4 mb-5 rounded-lg border border-white/[0.07] sm:mx-6">
            {loading ? (
              <p className="py-10 text-center text-sm text-pacova-pink">{t("friends_loading")}</p>
            ) : tab === "pending" ? (
              list(requests.incoming, "friends_empty_pending", requestRow)
            ) : tab === "blocked" ? (
              list(blocked, "friends_empty_blocked", (u) => userRow(u, unblockBtn(u)))
            ) : tab === "online" ? (
              list(onlineFriends, "friends_empty_online", friendRow)
            ) : (
              list(friends, "friends_empty_friends", friendRow)
            )}
          </div>
        </Card>
      </main>
    </Background>
  );
}