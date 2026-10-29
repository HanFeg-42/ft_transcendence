import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../components/ui/Background";
import { Navbar } from "../components/ui/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  getLeaderboardRows,
  type LeaderboardRow,
} from "../services/leaderboardService";

// Copy the routeMap from Home.tsx and add LEADERBOARD (they must match)
const routeMap: Record<string, string> = {
  HOME: "/home",
  LEADERBOARD: "/leaderboard",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};

export default function Leaderboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      setRows(await getLeaderboardRows(token, 100));
    } catch {
      setError(t("leaderboardPage.loadError"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const myRow = useMemo(
    () => rows.find((row) => row.userId === user?.id),
    [rows, user?.id],
  );

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  return (
    <Background>
      <Navbar activeTab="LEADERBOARD" onSelectTab={handleSelectTab} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <p role="status" className="font-vt323 text-xl text-white">
            {t("leaderboardPage.loading")}
          </p>
        ) : error ? (
          <div role="alert" className="font-vt323 text-xl text-pacova-pink">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadLeaderboard()}
              className="mt-4 border border-pacova-pink rounded px-4 py-2 hover:bg-pacova-pink/10"
            >
              {t("leaderboardPage.retry")}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="font-vt323 text-xl text-white">
            {t("leaderboardPage.empty")}
          </p>
        ) : (
          <>
            <p className="font-vt323 text-xl text-gray-300 mb-6">
              {myRow
                ? t("leaderboardPage.yourRank", {
                    rank: myRow.rank,
                    wins: myRow.wins,
                  })
                : t("leaderboardPage.noWins")}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full font-vt323 text-xl text-white">
                <caption className="sr-only">
                  {t("leaderboardPage.caption")}
                </caption>
                <thead>
                  <tr className="text-left text-gray-400 border-b border-pacova-pink/40">
                    <th scope="col" className="py-2 pr-4 w-20">
                      {t("leaderboardPage.rank")}
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      {t("leaderboardPage.player")}
                    </th>
                    <th scope="col" className="py-2 text-right">
                      {t("leaderboardPage.wins")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isMe = row.userId === user?.id;

                    return (
                      <tr
                        key={row.userId}
                        aria-current={isMe ? "true" : undefined}
                        className={`border-b border-white/10 ${isMe ? "bg-pacova-pink/15" : ""}`}
                      >
                        <td
                          className={`py-3 pr-4 ${row.rank <= 3 ? "text-pacova-green" : ""}`}
                        >
                          #{row.rank}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            to={isMe ? "/profile" : `/profile/${row.userId}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            {row.avatarUrl ? (
                              <img
                                src={row.avatarUrl}
                                alt=""
                                loading="lazy"
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="w-10 h-10 rounded-full bg-pacova-surface border border-pacova-pink flex items-center justify-center"
                              >
                                {row.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span>
                              {row.username}
                              {isMe && ` (${t("leaderboardPage.you")})`}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-right">{row.wins}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </Background>
  );
}