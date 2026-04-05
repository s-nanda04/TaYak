import { useEffect, useState } from "react";
import { API_BASE } from "../apiBase";

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topContributors, setTopContributors] = useState([]);
  const [topTopics, setTopTopics] = useState([]);
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/leaderboard`);
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        if (!mounted) return;
        setTopContributors(data.top_contributors || []);
        setTopTopics(data.top_topics || []);
        setTopPosts(data.top_posts || []);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Could not load leaderboard. Is the backend running?");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-app text-txt-primary p-6 font-sans">
        Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app text-red-400 p-6 font-sans">
        {error}
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];

  return (
    <div className="min-h-screen bg-app text-txt-primary p-5 font-sans">
      <h1 className="text-xl font-bold mb-6">TaYak — Leaderboard</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-txt-secondary mb-3">Top contributors</h2>
        <p className="text-caption text-txt-tertiary mb-3">
          Counted from posts in <code className="text-txt-secondary">yaks</code> (one row per post per{" "}
          <code className="text-txt-secondary">author_name</code>).
        </p>
        {topContributors.length === 0 ? (
          <p className="text-txt-tertiary text-sm">No posts yet.</p>
        ) : (
          <ul className="space-y-2">
            {topContributors.map((row, i) => (
              <li
                key={`${row.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-subtle bg-surface px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  <span>{medals[i] ?? `${i + 1}.`}</span>
                  <span className="font-medium">{row.name}</span>
                </span>
                <span className="text-sm text-txt-secondary">{row.posts} posts</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-txt-secondary mb-3">Top topics</h2>
        {topTopics.length === 0 ? (
          <p className="text-txt-tertiary text-sm">No topics yet.</p>
        ) : (
          <ul className="space-y-2">
            {topTopics.map((row, i) => (
              <li
                key={`${row.topic}-${i}`}
                className="flex items-center justify-between rounded-lg border border-subtle bg-surface px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  <span>{medals[i] ?? `${i + 1}.`}</span>
                  <span className="font-medium">{row.topic}</span>
                </span>
                <span className="text-sm text-txt-secondary">{row.posts} posts</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-txt-secondary mb-3">Most upvoted posts</h2>
        {topPosts.length === 0 ? (
          <p className="text-txt-tertiary text-sm">No posts yet.</p>
        ) : (
          <ul className="space-y-2">
            {topPosts.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-subtle bg-surface px-4 py-3"
              >
                <p className="text-sm text-txt-primary leading-relaxed">{row.text}</p>
                <p className="text-sm text-blob-blue font-semibold mt-2">▲ {row.votes} votes</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
