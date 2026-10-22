import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import { useAuth } from "../context/AuthContext";

type PublicUser = {
  id: number;
  username: string;
  avatar?: string | null;
  online?: boolean;
  relation?: "self" | "friend" | "incoming_request" | "outgoing_request" | "blocked" | "none";
};
type FriendRequest = {
  id: string;
  userId: number;
  username: string;
  avatar?: string | null;
  createdAt?: string;
};
type RequestLists = { incoming: FriendRequest[]; outgoing: FriendRequest[] };

const API = "/api/chat";

async function apiRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data.error === "string" ? data.error : `Request failed (${response.status})`;
    throw new Error(`${response.status}: ${message}`);
  }
  return data as T;
}

const buttonClass = "border px-3 py-2 font-vt323 text-lg uppercase transition disabled:cursor-not-allowed disabled:opacity-40";
const primaryButton = `${buttonClass} border-pacova-pink text-pacova-pink hover:bg-pacova-pink hover:text-black`;
const greenButton = `${buttonClass} border-pacova-green text-pacova-green hover:bg-pacova-green hover:text-black`;
const dangerButton = `${buttonClass} border-red-500 text-red-400 hover:bg-red-500 hover:text-black`;

function UserAvatar({ user }: { user: Pick<PublicUser, "username" | "avatar" | "online"> }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = user.username.slice(0, 1).toUpperCase() || "?";
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border-2 border-pacova-pink bg-[#211027] font-pixelify text-xl text-pacova-green">
      {user.avatar && !imageFailed ? (
        <img src={user.avatar} alt={`${user.username} avatar`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      ) : initials}
      {user.online !== undefined && <span className={`absolute bottom-0 right-0 h-3 w-3 border border-[#130718] ${user.online ? "bg-pacova-green" : "bg-gray-500"}`} />}
    </div>
  );
}

function Panel({ title, children, count }: { title: string; children: ReactNode; count?: number }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border-2 border-pacova-green-dark bg-pacova-surface/95">
      <header className="flex items-center justify-between border-b-2 border-pacova-green-dark px-4 py-3">
        <h2 className="font-pixelify text-xl uppercase tracking-wide text-pacova-green">{title}</h2>
        {count !== undefined && <span className="font-vt323 text-xl text-gray-400">{count}</span>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function FriendsTest() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [requests, setRequests] = useState<RequestLists>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSelectTab = (tab: string) => {
    const routes: Record<string, string> = {
      HOME: "/home", PROFILE: "/profile", CHAT: "/chat",
      NOTIFICATION: "/notifications", SETTINGS: "/settings",
    };
    if (routes[tab]) navigate(routes[tab]);
  };

  const refreshLists = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [friendData, requestData] = await Promise.all([
        apiRequest<PublicUser[]>("/friends", token),
        apiRequest<RequestLists>("/friends/requests", token),
      ]);
      setFriends(Array.isArray(friendData) ? friendData : []);
      setRequests({
        incoming: Array.isArray(requestData?.incoming) ? requestData.incoming : [],
        outgoing: Array.isArray(requestData?.outgoing) ? requestData.outgoing : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load friends data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void refreshLists(); }, [refreshLists]);

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
      const data = await apiRequest<PublicUser[]>(`/users/search?q=${encodeURIComponent(query.trim())}`, token);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const runAction = async (key: string, path: string, method: string, body?: unknown, successMessage = "Action completed.") => {
    if (!token) return;
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      await apiRequest(path, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      setNotice(successMessage);
      await refreshLists();
      if (query.trim()) {
        try {
          const updated = await apiRequest<PublicUser[]>(`/users/search?q=${encodeURIComponent(query.trim())}`, token);
          setResults(Array.isArray(updated) ? updated : []);
        } catch { /* Keep the previous search results if refresh search fails. */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyKey("");
    }
  };

  const renderSearchAction = (user: PublicUser) => {
    const busy = busyKey === `user-${user.id}`;
    if (user.relation === "friend") {
      return <button className={dangerButton} disabled={!!busyKey} onClick={() => void runAction(`user-${user.id}`, `/friends/${user.id}`, "DELETE", undefined, `Removed ${user.username}.`)}>{busy ? "Working…" : "Remove"}</button>;
    }
    if (user.relation === "incoming_request") {
      const request = requests.incoming.find((item) => item.userId === user.id);
      return <button className={greenButton} disabled={!!busyKey || !request} onClick={() => request && void runAction(`user-${user.id}`, `/friends/requests/${request.id}/accept`, "POST", undefined, `Accepted ${user.username}.`)}>{busy ? "Working…" : "Accept"}</button>;
    }
    if (user.relation === "outgoing_request") {
      const request = requests.outgoing.find((item) => item.userId === user.id);
      return <button className={dangerButton} disabled={!!busyKey || !request} onClick={() => request && void runAction(`user-${user.id}`, `/friends/requests/${request.id}`, "DELETE", undefined, "Request cancelled.")}>{busy ? "Working…" : "Cancel request"}</button>;
    }
    if (user.relation === "blocked") return <span className="font-vt323 text-lg text-gray-500">Blocked</span>;
    return <button className={primaryButton} disabled={!!busyKey} onClick={() => void runAction(`user-${user.id}`, "/friends/requests", "POST", { userId: user.id }, `Request sent to ${user.username}.`)}>{busy ? "Working…" : "Add friend"}</button>;
  };

  const renderUserRow = (user: PublicUser, action?: React.ReactNode) => (
    <div key={user.id} className="flex min-w-0 items-center gap-3 border-b border-white/10 py-3 last:border-b-0">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-pixelify text-lg text-white">{user.username}</p>
        {user.online !== undefined && <p className={`font-vt323 text-base ${user.online ? "text-pacova-green" : "text-gray-500"}`}>{user.online ? "ONLINE" : "OFFLINE"}</p>}
      </div>
      {action}
    </div>
  );

  const renderRequestRow = (request: FriendRequest, kind: "incoming" | "outgoing") => (
    <div key={request.id} className="flex min-w-0 items-center gap-3 border-b border-white/10 py-3 last:border-b-0">
      <UserAvatar user={request} />
      <div className="min-w-0 flex-1"><p className="truncate font-pixelify text-lg text-white">{request.username}</p><p className="font-vt323 text-base text-gray-500">{kind === "incoming" ? "WANTS TO CONNECT" : "WAITING FOR RESPONSE"}</p></div>
      {kind === "incoming" ? (
        <div className="flex flex-wrap gap-2">
          <button className={greenButton} disabled={!!busyKey} onClick={() => void runAction(`request-${request.id}`, `/friends/requests/${request.id}/accept`, "POST", undefined, `Accepted ${request.username}.`)}>Accept</button>
          <button className={dangerButton} disabled={!!busyKey} onClick={() => void runAction(`request-${request.id}`, `/friends/requests/${request.id}/decline`, "POST", undefined, `Declined ${request.username}.`)}>Decline</button>
        </div>
      ) : <button className={dangerButton} disabled={!!busyKey} onClick={() => void runAction(`request-${request.id}`, `/friends/requests/${request.id}`, "DELETE", undefined, "Request cancelled.")}>Cancel</button>}
    </div>
  );

  return (
    <Background>
      <Navbar activeTab="CHAT" onSelectTab={handleSelectTab} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-press-start text-xs text-pacova-pink">FRD-01 / QA TOOL</p>
            <h1 className="mt-3 font-pixelify text-4xl uppercase text-white sm:text-5xl">Friends API Test</h1>
            <p className="mt-2 font-vt323 text-xl text-gray-400">Search users, manage requests, and verify the Friends endpoints.</p>
          </div>
          <button className={greenButton} onClick={() => void refreshLists()} disabled={loading || !!busyKey}>{loading ? "Refreshing…" : "Refresh lists"}</button>
        </div>

        {error && <div role="alert" className="mb-4 rounded border border-red-500 bg-red-950/50 px-4 py-3 font-vt323 text-xl text-red-300">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded border border-pacova-green bg-green-950/40 px-4 py-3 font-vt323 text-xl text-pacova-green">{notice}</div>}

        <section className="mb-6 rounded-lg border-2 border-pacova-pink/70 bg-pacova-surface/95 p-4 sm:p-5">
          <h2 className="mb-3 font-pixelify text-2xl uppercase text-pacova-pink">Find players</h2>
          <form onSubmit={searchUsers} className="flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by username…" aria-label="Search by username" className="min-w-0 flex-1 border-2 border-pacova-gray bg-[#0D0914] px-4 py-3 font-vt323 text-xl text-white outline-none placeholder:text-gray-600 focus:border-pacova-pink" />
            <button className={primaryButton} type="submit" disabled={searching}>{searching ? "Searching…" : "Search users"}</button>
          </form>
          <div className="mt-3">
            {results.length === 0 ? <p className="font-vt323 text-lg text-gray-500">Search results will appear here. Search excludes your own account.</p> : results.map((user) => renderUserRow(user, renderSearchAction(user)))}
          </div>
        </section>

        {loading ? <p className="py-8 text-center font-pixelify text-2xl text-pacova-pink">Loading friends data…</p> : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel title="Incoming requests" count={requests.incoming.length}>
              {requests.incoming.length === 0 ? <p className="font-vt323 text-lg text-gray-500">No incoming requests.</p> : requests.incoming.map((request) => renderRequestRow(request, "incoming"))}
            </Panel>
            <Panel title="Outgoing requests" count={requests.outgoing.length}>
              {requests.outgoing.length === 0 ? <p className="font-vt323 text-lg text-gray-500">No outgoing requests.</p> : requests.outgoing.map((request) => renderRequestRow(request, "outgoing"))}
            </Panel>
            <div className="xl:col-span-2">
              <Panel title="Your friends" count={friends.length}>
                {friends.length === 0 ? <p className="font-vt323 text-lg text-gray-500">No friends yet. Search a username above to send a request.</p> : <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">{friends.map((friend) => renderUserRow(friend, <button key={`remove-${friend.id}`} className={dangerButton} disabled={!!busyKey} onClick={() => void runAction(`friend-${friend.id}`, `/friends/${friend.id}`, "DELETE", undefined, `Removed ${friend.username}.`)}>Remove</button>))}</div>}
              </Panel>
            </div>
          </div>
        )}
        <p className="mt-5 text-center font-vt323 text-base text-gray-600">Temporary testing page — API calls use your logged-in session token.</p>
      </main>
    </Background>
  );
}
