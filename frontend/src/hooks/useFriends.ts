import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChatEvents } from "../../../shared/types/chat-types";

export type User = { id: number; username: string; avatar?: string | null; online?: boolean; relation?: string };
export type Req = { id: string; userId: number; username: string; avatar?: string | null };
type Msg = { kind: "error" | "notice"; text: string } | null;

// Socket events
const REFRESH = ["friend_request", "friend_request_cancelled", "friend_request_declined",
                 "friend_accepted", "friend_removed", ChatEvents.BLOCK_UPDATED];

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

// Call the chat service (JWT + 10s timeout). Throws "status: error".
async function api<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/chat${path}`, {
    ...init,
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.error ?? "Request failed"}`);
  return data as T;
}

// WebSocket with automatic reconnect (1s, 2s, 4s ... max 30s). Returns a cleanup function.
function openSocket(token: string, onOpen: () => void, onPacket: (p: any) => void) {
  let ws: WebSocket;
  let timer: ReturnType<typeof setTimeout>;
  let retries = 0;
  let closed = false;

  const connect = () => {
    ws = new WebSocket(`wss://${location.host}/api/chat/ws?token=${encodeURIComponent(token)}`);
    ws.onopen = () => {
      retries = 0;
      onOpen();
    };

    ws.onmessage = (m) => {
      try {
        onPacket(JSON.parse(m.data));
      } catch {
        // ignore packets we can't read
      }
    };

    ws.onclose = () => {
      if (closed) return;
      timer = setTimeout(connect, Math.min(1000 * 2 ** retries, 30000));
      retries++;
    };
  };

  connect();
  return () => {
    closed = true;
    clearTimeout(timer);
    ws.close();
  };
}


/** Everything the friends page needs: lists, search, live updates and actions. */
export default function useFriends(token: string | null) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const lastQuery = useRef("");                      // the query of the last submitted search
  const [results, setResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [blocked, setBlocked] = useState<User[]>([]);
  const [requests, setRequests] = useState({ incoming: [] as Req[], outgoing: [] as Req[] });
  const [presence, setPresence] = useState<Record<number, boolean>>({}); // user id -> online (from the socket)
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

  const say = (kind: "error" | "notice", text: string) => setMsg({ kind, text });
  const call = useCallback(<T,>(path: string, init?: RequestInit) => api<T>(path, token!, init), [token]);

  // Messages disappear after 3s
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(id);
  }, [msg]);


  /* ---------------- Loading (REST) ---------------- */

  const load = useCallback(async () => {
    try {
      const [f, r, b] = await Promise.all([
        call<User[]>("/friends"),
        call<{ incoming: Req[]; outgoing: Req[] }>("/friends/requests"),
        call<User[]>("/blocks"),
      ]);
      setFriends(arr(f));
      setRequests({ incoming: arr(r?.incoming), outgoing: arr(r?.outgoing) });
      setBlocked(arr(b));
    } catch {
      say("error", t("friends_errors_loadFriends"));
    } finally {
      setLoading(false);
    }
  }, [call, t]);

  const search = useCallback(async () => {
    const q = lastQuery.current;
    setResults(q ? arr<User>(await call<User[]>(`/users/search?q=${encodeURIComponent(q)}`)) : []);
  }, [call]);

  const refresh = useCallback(() => Promise.all([load(), search().catch(() => {})]), [load, search]);

  useEffect(() => {
    if (!token) return setLoading(false);
    void load();
  }, [token, load]);


  /* ---------------- WebSocket ---------------- */

  useEffect(() => {
    if (!token) return;
    const reload = () => { setPresence({}); void refresh(); }; // the server's "online" is fresh after a reload

    return openSocket(token, reload, (p) => {
      const name = p.event ?? p.type;
      if (REFRESH.includes(name)) return reload();
      if (name === ChatEvents.PRESENCE && typeof p.data?.user_id === "number") {
        setPresence((old) => ({ ...old, [p.data.user_id]: p.data.status === "online" }));
      }
    });
  }, [token, refresh]);


  /* ---------------- Actions ---------------- */

  const submitSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    lastQuery.current = query.trim();
    if (!lastQuery.current) {
      setResults([]);
      return say("error", t("friends_errors_enterUsername"));
    }
    setSearching(true);
    setMsg(null);
    try {
      await search();
    } catch {
      say("error", t("friends_errors_searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  // Any button: send / accept / decline / cancel a request, remove a friend, block / unblock
  const act = async (key: string, path: string, method: string, ok: string, body?: unknown) => {
    if (!token) return;
    setBusy(key);
    setMsg(null);
    try {
      await call(path, { method, body: body ? JSON.stringify(body) : undefined });
      say("notice", ok);
    } catch (e) {
      const gone = path.startsWith("/friends/requests/") && /404|not found/i.test(String(e));
      if (gone) say("notice", t("friends_messages_requestNoLongerPending"));
      else say("error", t("friends_errors_actionFailed"));
    }
    await refresh();
    setBusy("");
  };

  return {
    query, setQuery, results, blocked, requests,
    friends: friends.map((f) => ({ ...f, online: presence[f.id] ?? f.online })),
    loading, searching, busy, msg,
    submitSearch, act,
  };
}
