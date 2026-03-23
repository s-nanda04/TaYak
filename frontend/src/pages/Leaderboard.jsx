import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const API = "http://localhost:8000";

export default function Leaderboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/leaderboard`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to load leaderboard");
        return r.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(e => { console.error(e); setError(e.message); setLoading(false); });
  }, []);

  const medals = ["🥇", "🥈", "🥉", "4.", "5.", "6.", "7.", "8.", "9.", "10."];

  const Section = ({ title, children }) => (
    <>
      <h2 className="text-body-sm font-semibold text-txt-secondary uppercase tracking-wider mb-3 px-1">
        {title}
      </h2>
      <div className="bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden mb-6">
        {children}
      </div>
    </>
  );

  const Row = ({ left, right, index, total }) => (
    <div className={`flex items-center gap-3 px-4 py-3 ${index < total - 1 ? "border-b border-subtle" : ""}`}>
      <span className="text-[20px] w-8 text-center shrink-0">{medals[index]}</span>
      <span className="flex-1 text-body-md text-txt-primary font-medium">{left}</span>
      <span className="text-caption text-txt-tertiary">{right}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-app font-sans relative">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[380px] h-[380px] rounded-full bg-blob-blue/25 blur-[80px] animate-blob-drift" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blob-soft/35 blur-[70px] animate-blob-drift-2" />
      </div>

      <div className="sticky top-0 z-50 bg-app/80 backdrop-blur-xl border-b border-subtle">
        <div className="max-w-[600px] mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3.5">
              <button onClick={() => setSidebarOpen(true)} className="flex flex-col gap-1 p-1 group">
                <span className="w-[22px] h-[2px] bg-txt-secondary rounded-full block group-hover:bg-txt-primary transition-colors duration-[120ms]" />
                <span className="w-[22px] h-[2px] bg-txt-secondary rounded-full block group-hover:bg-txt-primary transition-colors duration-[120ms]" />
                <span className="w-[22px] h-[2px] bg-txt-secondary rounded-full block group-hover:bg-txt-primary transition-colors duration-[120ms]" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/tamid-logo.png" alt="TaYak" className="w-7 h-7 rounded-xs object-cover" />
                <span className="font-extrabold text-[18px] text-txt-primary tracking-tight">TaYak</span>
              </div>
            </div>
            <span className="text-body-sm text-txt-secondary font-semibold">Leaderboard</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[600px] mx-auto px-3 md:px-0 pt-4 pb-10">
        {loading && (
          <p className="text-center text-txt-secondary py-16 text-body-md">Loading leaderboard…</p>
        )}
        {error && (
          <p className="text-center text-error-text py-16 text-body-md">{error}</p>
        )}
        {data && (
          <>
            <Section title="Top Contributors">
              {data.top_contributors.map((p, i) => (
                <Row key={p.name} left={p.name} right={`${p.posts} posts`} index={i} total={data.top_contributors.length} />
              ))}
            </Section>

            <Section title="Top Topics">
              {data.top_topics.map((t, i) => (
                <Row key={t.topic} left={t.topic} right={`${t.posts} posts`} index={i} total={data.top_topics.length} />
              ))}
            </Section>

            <h2 className="text-body-sm font-semibold text-txt-secondary uppercase tracking-wider mb-3 px-1">
              Most Upvoted Posts
            </h2>
            <div className="bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
              {data.top_posts.map((post, i) => (
                <div key={post.id} className={`px-4 py-3 ${i < data.top_posts.length - 1 ? "border-b border-subtle" : ""}`}>
                  <p className="text-body-md text-txt-primary leading-relaxed">{post.text}</p>
                  <span className="text-caption text-blob-blue font-bold mt-1.5 inline-block">
                    ▲ {post.votes} upvotes
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}