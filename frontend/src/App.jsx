import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Sidebar from "./components/Sidebar";
import { YakCard, getRelativeTime, getAvatarForId, getColorForId } from "./components/YakCard";

const API = "http://localhost:8000";
const MAX_CHARS = 255;
const MAX_TOPIC_CHARS = 32;
const CUSTOM_TOPIC_VALUE = "__custom__";

export default function App() {
  const [tab, setTab] = useState("new");
  const [yaks, setYaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [postText, setPostText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("General");
  const [customTopic, setCustomTopic] = useState("");
  const [posting, setPosting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const tabs = [
    { key: "new", label: "Unread" },
    { key: "trending", label: "Trending" },
  ];

  const updateIndicator = () => {
    const btn = tabRefs.current[tab];
    const container = tabContainerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setIndicator({
        left: bRect.left - cRect.left,
        width: bRect.width,
      });
    }
  };

  useLayoutEffect(updateIndicator, [tab]);
  useEffect(() => { window.addEventListener("resize", updateIndicator); return () => window.removeEventListener("resize", updateIndicator); }, [tab]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/yaks`, { headers })
      .then(r => r.json())
      .then(data => { setYaks(data); setLoading(false); })
      .catch(e => { console.error("Failed to load yaks", e); setLoading(false); });
  }, []);

  const existingTopics = (() => {
    const set = new Set();
    for (const y of yaks) {
      const t = (y?.topic || "").trim();
      if (t) set.add(t);
    }
    const rest = [...set].filter(t => t.toLowerCase() !== "general").sort((a, b) => a.localeCompare(b));
    return ["General", ...rest];
  })();

  const effectiveTopic = (() => {
    if (selectedTopic === CUSTOM_TOPIC_VALUE) {
      return customTopic.trim() || "General";
    }
    return (selectedTopic || "").trim() || "General";
  })();

  const resetComposer = () => {
    setComposing(false);
    setPostText("");
    setSelectedTopic("General");
    setCustomTopic("");
  };

  const handlePost = async () => {
    const trimmed = postText.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/yaks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, topic: effectiveTopic }),
      });
      if (!res.ok) throw new Error("Post failed");
      const newYak = await res.json();
      setYaks(prev => [newYak, ...prev]);
      resetComposer();
    } catch (e) {
      console.error("Failed to create yak", e);
    } finally {
      setPosting(false);
    }
  };

  const trendingYaks = [...yaks].sort((a, b) => b.votes - a.votes);
  const newYaks = [...yaks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const displayYaks = tab === "new" ? newYaks : trendingYaks;

  const handleVote = async (id, voteValue, delta) => {
    setYaks(prev => prev.map(y => y.id === id ? { ...y, votes: y.votes + delta, user_vote: voteValue } : y));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/yaks/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vote_value: voteValue }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Vote failed", err);
        setYaks(prev => prev.map(y => y.id === id ? { ...y, votes: y.votes - delta, user_vote: voteValue - delta } : y));
      }
    } catch (e) {
      console.error("Vote failed", e);
      setYaks(prev => prev.map(y => y.id === id ? { ...y, votes: y.votes - delta, user_vote: voteValue - delta } : y));
    }
  };

  return (
    <div className="min-h-screen bg-app font-sans relative">
      {/* Everything behind the composer */}
      <div className={`transition-[filter,transform] duration-200 ${composing ? "compose-blur" : ""}`}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Ambient blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[380px] h-[380px] rounded-full bg-blob-blue/25 blur-[80px] animate-blob-drift" />
          <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blob-soft/35 blur-[70px] animate-blob-drift-2" />
        </div>

        {/* Top nav */}
        <div className="sticky top-0 z-50 bg-app/60 backdrop-blur-2xl border-b border-white/20">
          <div className="max-w-[600px] mx-auto px-5">
            <div className="flex items-center justify-between h-14">
              {/* Left: hamburger + logo */}
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

              {/* Right: tab pills */}
              <div ref={tabContainerRef} className="relative flex items-center liquid-glass p-[3px]">
                {/* Sliding glass indicator */}
                <div
                  className="absolute top-[3px] h-[calc(100%-6px)] liquid-glass-pill pointer-events-none"
                  style={{
                    left: indicator.left,
                    width: indicator.width,
                    transition: "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                {tabs.map(t => (
                  <button
                    key={t.key}
                    ref={el => { tabRefs.current[t.key] = el; }}
                    onClick={() => setTab(t.key)}
                    className={`relative z-10 px-4 py-[6px] text-body-sm rounded-full transition-colors duration-200 ${
                      tab === t.key
                        ? "text-txt-primary font-semibold"
                        : "text-txt-secondary hover:text-txt-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="relative z-10 max-w-[600px] mx-auto">
          <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
            {loading ? (
              <div className="text-center text-txt-secondary py-16 text-body-md">
                Loading yaks...
              </div>
            ) : displayYaks.length === 0 ? (
              <div className="text-center text-txt-secondary py-16 text-body-md">
                No yaks yet. Be the first.
              </div>
            ) : displayYaks.map((yak, i) => (
              <YakCard
                key={yak.id}
                yak={{
                  ...yak,
                  time: getRelativeTime(yak.created_at),
                  profile_pic: yak.profile_pic || getAvatarForId(yak.id),
                  color: yak.color || getColorForId(yak.id),
                }}
                onVote={handleVote}
                isLast={i === displayYaks.length - 1}
              />
            ))}
          </div>
          {/* Bottom spacer for FAB */}
          <div className="h-24" />
        </div>

        {/* FAB */}
        <button
          onClick={() => setComposing(true)}
          className="fixed bottom-7 right-5 md:right-[calc(50%-280px)] w-14 h-14 liquid-glass-fab flex items-center justify-center z-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444A55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/16"
            onClick={() => { if (!posting) resetComposer(); }}
          />
          <div className="relative w-full sm:max-w-[480px] bg-card border border-[#ECEDEF] sm:rounded-md rounded-t-md shadow-card mx-0 sm:mx-4 animate-toast-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button
                onClick={() => { if (!posting) resetComposer(); }}
                className="text-body-sm text-txt-secondary hover:text-txt-primary transition-colors duration-[120ms]"
              >
                Cancel
              </button>
              <span className="font-semibold text-body-md text-txt-primary">New Post</span>
              <button
                onClick={handlePost}
                disabled={!postText.trim() || postText.length > MAX_CHARS || posting}
                className="px-5 py-[6px] liquid-glass-on-card text-txt-primary text-btn-md font-semibold disabled:opacity-40 disabled:pointer-events-none"
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>

            {/* Topic */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-caption text-txt-tertiary font-semibold uppercase tracking-wider shrink-0">
                  Topic
                </span>
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    if (e.target.value !== CUSTOM_TOPIC_VALUE) setCustomTopic("");
                  }}
                  className="flex-1 min-w-0 bg-transparent text-body-sm text-txt-primary outline-none border border-subtle rounded-xs px-3 py-2"
                  disabled={posting}
                >
                  {existingTopics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value={CUSTOM_TOPIC_VALUE}>Custom…</option>
                </select>
              </div>
              {selectedTopic === CUSTOM_TOPIC_VALUE && (
                <input
                  value={customTopic}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next.length <= MAX_TOPIC_CHARS) setCustomTopic(next);
                  }}
                  placeholder="Enter a topic"
                  maxLength={MAX_TOPIC_CHARS}
                  className="mt-2 w-full bg-transparent text-body-sm text-txt-primary placeholder:text-placeholder outline-none border border-subtle rounded-xs px-3 py-2"
                  disabled={posting}
                />
              )}
              <div className="mt-1 text-caption text-txt-tertiary">
                Posting as <span className="font-semibold text-txt-secondary">{effectiveTopic}</span>
              </div>
            </div>

            {/* Textarea */}
            <div className="px-5 pb-2">
              <textarea
                autoFocus
                value={postText}
                onChange={e => {
                  if (e.target.value.length <= MAX_CHARS) setPostText(e.target.value);
                }}
                placeholder="What's on your mind?"
                maxLength={MAX_CHARS}
                rows={4}
                className="w-full resize-none bg-transparent text-body-md text-txt-primary placeholder:text-placeholder outline-none leading-relaxed"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-5 pb-4">
              <span className={`text-caption font-mono ${
                postText.length > MAX_CHARS * 0.9
                  ? postText.length >= MAX_CHARS ? "text-error-text" : "text-[#A06A2A]"
                  : "text-txt-tertiary"
              }`}>
                {postText.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
