import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../../components/ui/Background";
import Navbar from "../../components/ui/Navbar";
import Card from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import useFriends from "../../hooks/useFriends";
import type { Req, User } from "../../hooks/useFriends";

type Tab = "all" | "pending" | "blocked";

// Navbar tab -> page route
const ROUTES: Record<string, string> = {
  HOME: "/home",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
  LEADERBOARD: "/leaderboard",
};


/* ---------------- Styles ---------------- */

const DISABLED = "disabled:cursor-not-allowed disabled:opacity-40";
const BTN = `rounded-lg px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-medium transition ${DISABLED}`;
const PRIMARY = `${BTN} bg-pacova-pink text-white hover:brightness-110`;
const GREEN = `${BTN} bg-pacova-green text-[#0D0914] hover:brightness-110`;
const DANGER = `${BTN} border border-red-500/40 text-red-400 hover:bg-red-500/10`;
const ICON = `rounded-lg p-2 sm:text-sm ${DISABLED} disabled:hover:bg-transparent`;


/* ---------------- Small components ---------------- */

// One row: avatar, username, optional note / online status, and the buttons (children)
function Row({ user, note, online, children }: {
  user: Pick<User, "username" | "avatar">;
  note?: string;
  online?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0 hover:bg-white/[0.025]">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#211027]">
        <img
          src={user.avatar ?? undefined}
          alt={t("friends_avatarAlt", { username: user.username })}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{user.username}</p>
        {note && <p className="mt-0.5 text-xs text-gray-600">{note}</p>}
        {online !== undefined && (
          <p className={`mt-0.5 text-xs ${online ? "text-pacova-green" : "text-gray-600"}`}>
            <span className="mr-1">●</span>
            {online ? t("friends_status_online") : t("friends_status_offline")}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

// Small icon button with an accessible label (the title defaults to the label)
function IconBtn({ label, title = label, className, disabled, onClick, children }: {
  label: string;
  title?: string;
  className: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button aria-label={label} title={title} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}


/* ---------------- Page ---------------- */

export default function Friends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const {
    query, setQuery, results, friends, blocked, requests,
    loading, searching, busy, msg,
    submitSearch, act,
  } = useFriends(token);

  const initialTab = useSearchParams()[0].get("tab");
  const [tab, setTab] = useState<Tab>(initialTab === "pending" || initialTab === "blocked" ? initialTab : "all");

  const counts: Record<Tab, number> = {
    all: friends.length,
    pending: requests.incoming.length,
    blocked: blocked.length,
  };


  /* ---------------- Buttons ---------------- */

  const unblockBtn = (u: User) => (
    <button
      className={GREEN}
      disabled={!!busy}
      onClick={() => void act(`block-${u.id}`, `/blocks/${u.id}`, "DELETE", t("friends_messages_unblocked", { username: u.username }))}
    >
      {busy === `block-${u.id}` ? t("friends_buttons_unblocking") : t("friends_buttons_unblock")}
    </button>
  );

  // The button next to a search result (depends on the relation with that user)
  const searchAction = (u: User) => {
    if (blocked.some((b) => b.id === u.id)) return unblockBtn(u);
    if (u.relation === "blocked") return <span className="text-sm text-gray-500">{t("friend_tabs_blocked")}</span>;

    const p = { username: u.username };
    const key = `user-${u.id}`;
    const req = [...requests.incoming, ...requests.outgoing].find((r) => r.userId === u.id);

    // relation -> [style, button label, path, method, success message, body]
    const config: Record<string, [string, string, string, string, string, unknown?]> = {
      friend: [DANGER, "remove", `/friends/${u.id}`, "DELETE", t("friends_messages_removed", p)],
      incoming_request: [GREEN, "accept", `/friends/requests/${req?.id}/accept`, "POST", t("friends_messages_accepted", p)],
      outgoing_request: [DANGER, "cancel", `/friends/requests/${req?.id}`, "DELETE", t("friends_messages_cancelled")],
    };
    const [style, label, path, method, ok, body] =
      config[u.relation ?? ""] ?? [PRIMARY, "addFriend", "/friends/requests", "POST", t("friends_messages_invitationSent", p), { userId: u.id }];

    const waitingForRequest = !!u.relation?.endsWith("_request") && !req;

    return (
      <button
        className={style}
        disabled={!!busy || waitingForRequest}
        onClick={() => void act(key, path, method, ok, body)}
      >
        {busy === key ? t("friends_buttons_working") : t(`friends_buttons_${label}`)}
      </button>
    );
  };


  /* ---------------- Rows ---------------- */

  const requestRow = (r: Req) => {
    const p = { username: r.username };
    const decide = (action: "accept" | "decline", msgKey: string) =>
      void act(`request-${r.id}`, `/friends/requests/${r.id}/${action}`, "POST", t(msgKey, p));

    return (
      <Row key={r.id} user={r} note={t("friends_requests_wantsToBeFriend")}>
        <div className="flex gap-2">
          <IconBtn
            label={t("friends_requests_acceptAriaLabel", p)}
            title={t("friends_requests_acceptTitle")}
            className="rounded-lg p-2 text-pacova-green hover:bg-pacova-green/10"
            disabled={!!busy}
            onClick={() => decide("accept", "friends_messages_accepted")}
          >
            ✓
          </IconBtn>
          <IconBtn
            label={t("friends_requests_declineAriaLabel", p)}
            title={t("friends_requests_declineTitle")}
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            disabled={!!busy}
            onClick={() => decide("decline", "friends_messages_declined")}
          >
            ✕
          </IconBtn>
        </div>
      </Row>
    );
  };

  const friendRow = (f: User) => {
    const p = { username: f.username };

    return (
      <Row key={f.id} user={f} online={f.online}>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn
            label={t("friends_actions_chatWith", p)}
            className={`${ICON} text-gray-300 hover:bg-white/10`}
            onClick={() => navigate("/chat")}
          >
            💬
          </IconBtn>
          <IconBtn
            label={t("friends_actions_blockUser", p)}
            className={`${ICON} text-red-400 hover:bg-red-500/10`}
            disabled={!!busy || blocked.some((b) => b.id === f.id)}
            onClick={() => void act(`block-${f.id}`, `/blocks/${f.id}`, "POST", t("friends_messages_blocked", p))}
          >
            <span className="sm:hidden">🚫</span>
            <span className="hidden sm:inline">
              {busy === `block-${f.id}` ? t("friends_buttons_blocking") : t("friends_buttons_block")}
            </span>
          </IconBtn>
          <IconBtn
            label={t("friends_actions_removeUser", p)}
            className={`${ICON} text-gray-400 hover:bg-red-500/10 hover:text-red-400`}
            disabled={!!busy}
            onClick={() => void act(`friend-${f.id}`, `/friends/${f.id}`, "DELETE", t("friends_messages_removed", p))}
          >
            <span className="sm:hidden">➖</span>
            <span className="hidden sm:inline">{t("friends_buttons_remove")}</span>
          </IconBtn>
        </div>
      </Row>
    );
  };

  const blockedRow = (u: User) => (
    <Row key={u.id} user={u} online={u.online}>
      {unblockBtn(u)}
    </Row>
  );

  // The rows of the selected tab
  const rows =
    tab === "pending" ? requests.incoming.map(requestRow)
    : tab === "blocked" ? blocked.map(blockedRow)
    : friends.map(friendRow);

  const emptyKey = tab === "all" ? "friends_empty_friends" : `friends_empty_${tab}`;

  return (
    <Background>
      <Navbar activeTab="PROFILE" onSelectTab={(s: string) => ROUTES[s] && navigate(ROUTES[s])} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6">
        <Card variant="gray" className="flex-1">
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-pixelify text-2xl text-white">👤 {t("friends_title")}</h1>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">{t("friends_subtitle")}</p>
              </div>

              <form onSubmit={submitSearch} className="flex w-full gap-2 sm:w-auto">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  maxLength={20}
                  placeholder={t("friends_searchPlaceholder")}
                  aria-label={t("friends_searchAriaLabel")}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#171120] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-300 focus:border-pacova-green/30 sm:w-48"
                />
                <button
                  type="submit"
                  aria-label={t("friends_searchButtonAriaLabel")}
                  className="rounded-lg bg-white/[0.06] px-3 text-gray-100 hover:bg-white/10"
                  disabled={searching}
                >
                  {searching ? "..." : "🔍︎"}
                </button>
              </form>
            </div>

            {results.length > 0 && (
              <div className="my-4 rounded-lg border border-pacova-pink/20">
                <div className="px-3 pt-2 text-xs font-semibold text-pacova-pink">{t("friends_searchResults")}</div>
                {results.map((u) => (
                  <Row key={u.id} user={u}>
                    {searchAction(u)}
                  </Row>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {(Object.keys(counts) as Tab[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition sm:text-sm ${
                    tab === id ? "bg-pacova-pink text-white" : "bg-white/[0.045] text-gray-500 hover:bg-white/[0.08]"
                  }`}
                >
                  {t(`friends_tabs_${id}`)}
                  <span className="ml-2 opacity-70">{counts[id]}</span>
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <div
              role={msg.kind === "error" ? "alert" : "status"}
              className={`mx-4 mb-3 rounded-lg border px-3 py-2 text-sm sm:mx-6 ${
                msg.kind === "error"
                  ? "border-red-500 bg-red-950/40 text-red-400"
                  : "border-pacova-green/40 bg-pacova-green/5 text-pacova-green"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="mx-4 mb-5 rounded-lg border border-white/[0.07] sm:mx-6">
            {loading ? (
              <p className="py-10 text-center text-sm text-pacova-pink">{t("friends_loading")}</p>
            ) : rows.length ? (
              rows
            ) : (
              <p className="px-4 py-10 text-center text-sm text-gray-500">{t(emptyKey)}</p>
            )}
          </div>
        </Card>
      </main>
    </Background>
  );
}
