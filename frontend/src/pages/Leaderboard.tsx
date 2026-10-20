import { useCallback, useEffect, useState } from "react";
import Background from "../components/ui/Background";
import { useAuth } from "../context/AuthContext";
import {
  getLeaderboard,
  type LeaderboardEntry,
} from "../services/leaderboardService";

export default function Leaderboard() {
  const { token } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard(token, 10);
      setEntries(data);
    } catch {
      setError("Failed to load the leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    void loadLeaderboard();
  }, [token, loadLeaderboard]);

  return (
    <Background>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-pixelify text-pacova-green text-3xl uppercase mb-8">
          Leaderboard
        </h1>

        {loading ? (
          <p role="status" className="font-vt323 text-xl text-white">
            Loading leaderboard...
          </p>
        ) : error ? (
          <div role="alert" className="font-vt323 text-xl text-pacova-pink">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadLeaderboard()}
              className="mt-4 border border-pacova-pink rounded px-4 py-2 hover:bg-pacova-pink/10"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="font-vt323 text-xl text-white">
            No champions yet. Win a match to appear here!
          </p>
        ) : (
          <p className="font-vt323 text-xl text-white">
            {entries.length} leaderboard entries
          </p>
        )}
      </main>
    </Background>
  );
}
