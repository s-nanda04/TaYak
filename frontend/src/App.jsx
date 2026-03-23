import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Sidebar from "./components/Sidebar";

const API = "http://localhost:8000";

const getRelativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const AVATARS = ["🦬", "🐻", "🦊", "🐸", "🐯", "🦁", "🐼", "🐨", "🐵", "🦄", "🐶", "🐱"];
const COLORS = ["#2F79F7", "#5A2FD4", "#E5484D", "#30A46C", "#E38B2F", "#3B82F6", "#8B5CF6", "#EC4899"];

const getAvatarForId = (id) => {
  const hash = (id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATARS[hash % AVATARS.length];
};

const getColorForId = (id) => {
  const hash = (id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

const YakCard = ({ yak, onVote, isLast }) => {
  const [userVote, setUserVote] = useState(yak.user_vote || 0);
  const [anim, setAnim] = useState(null);

  useEffect(() => {
    setUserVote(yak.user_vote || 0);
  }, [yak.user_vote]);

  const handleVote = (dir) => {
    setAnim(dir);
    setTimeout(() => setAnim(null), 200);
    const newVote = userVote === dir ? 0 : dir;
    const delta = newVote - userVote;
    setUserVote(newVote);
    onVote(yak.id, newVote, delta);
  };

  return (
    <div className={`px-5 py-4 ${isLast ? "" : "border-b border-subtle"}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[19px] shrink-0 border-2"
          style={{
            background: `${yak.color}12`,
            borderColor: `${yak.color}30`,
          }}
        >
          {yak.profile_pic}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-caption text-txt-tertiary">{yak.time} ago</span>
          <p className="text-body-md text-txt-primary mt-1 break-words whitespace-pre-wrap leading-relaxed">
            {yak.text}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pl-[52px]">
        {/* Votes */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleVote(1)}
            className="p-1.5 rounded-xs flex items-center hover:bg-surface transition-colors duration-[120ms]"
            style={{ transform: anim === 1 ? "scale(1.25)" : "scale(1)", transition: "transform 150ms ease" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={userVote === 1 ? "#2F79F7" : "none"} stroke={userVote === 1 ? "#2F79F7" : "#8D9098"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
          <span className={`font-bold text-body-sm min-w-[28px] text-center font-mono ${
            userVote === 1 ? "text-blob-blue" : userVote === -1 ? "text-violet-edge" : "text-txt-secondary"
          }`}>
            {yak.votes}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className="p-1.5 rounded-xs flex items-center hover:bg-surface transition-colors duration-[120ms]"
            style={{ transform: anim === -1 ? "scale(1.25)" : "scale(1)", transition: "transform 150ms ease" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={userVote === -1 ? "#5A2FD4" : "none"} stroke={userVote === -1 ? "#5A2FD4" : "#8D9098"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
        </div>

        {/* Comments */}
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-xs text-body-sm text-txt-secondary hover:bg-surface hover:text-txt-primary transition-colors duration-[120ms]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {yak.comments}
        </button>

        {/* Share */}
        <button className="p-1.5 rounded-xs flex items-center text-txt-secondary hover:bg-surface hover:text-txt-primary transition-colors duration-[120ms]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const MAX_CHARS = 255;

export default function App() {
  const [tab, setTab] = useState("new");
  const [yaks, setYaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [postText, setPostText] = useState("");
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

  const handlePost = async () => {
    const trimmed = postText.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/yaks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error("Post failed");
      const newYak = await res.json();
      setYaks(prev => [newYak, ...prev]);
      setPostText("");
      setComposing(false);
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

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/16"
            onClick={() => { if (!posting) { setComposing(false); setPostText(""); } }}
          />
          <div className="relative w-full sm:max-w-[480px] bg-card border border-[#ECEDEF] sm:rounded-md rounded-t-md shadow-card mx-0 sm:mx-4 animate-toast-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button
                onClick={() => { if (!posting) { setComposing(false); setPostText(""); } }}
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
