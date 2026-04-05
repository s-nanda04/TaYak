import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Sidebar from "./components/Sidebar";
import { API_BASE } from "./apiBase";

const API = API_BASE;

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

const YakCard = ({ yak, onVote, isLast, onOpenComments }) => {
  const [userVote, setUserVote] = useState(yak.user_vote || 0);
  const [anim, setAnim] = useState(null);
  const [shareTip, setShareTip] = useState("");

  useEffect(() => {
    setUserVote(yak.user_vote || 0);
  }, [yak.user_vote]);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/feed#yak-${yak.id}`;
    const title = "TaYak";
    const snippet = (yak.text || "").slice(0, 280);
    const payload = { title, text: snippet || "Check this on TaYak", url: shareUrl };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        const line = snippet ? `${snippet}\n\n${shareUrl}` : shareUrl;
        await navigator.clipboard.writeText(line);
        setShareTip("Copied link");
        setTimeout(() => setShareTip(""), 2500);
        return;
      }
    } catch {
      /* fall through */
    }
    window.prompt("Copy link:", shareUrl);
  };

  const handleVote = (dir) => {
    setAnim(dir);
    setTimeout(() => setAnim(null), 200);
    const newVote = userVote === dir ? 0 : dir;
    const delta = newVote - userVote;
    setUserVote(newVote);
    onVote(yak.id, newVote, delta);
  };

  return (
    <div id={`yak-${yak.id}`} className={`relative px-5 py-4 ${isLast ? "" : "border-b border-subtle"}`}>
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-caption text-txt-tertiary">{yak.time} ago</span>
            {yak.topic ? (
              <span className="text-caption font-semibold text-blob-blue bg-blob-blue/12 px-2 py-0.5 rounded-full border border-blob-blue/20">
                {yak.topic}
              </span>
            ) : null}
          </div>
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
            type="button"
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
            type="button"
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
        <button
          type="button"
          onClick={() => onOpenComments?.(yak)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xs text-body-sm text-txt-secondary hover:bg-surface hover:text-txt-primary transition-colors duration-[120ms]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {yak.comments ?? 0}
        </button>

        {/* Share */}
        <div className="relative flex items-center">
          {shareTip ? (
            <span className="absolute right-0 bottom-full mb-1 whitespace-nowrap text-caption font-medium text-blob-blue bg-card border border-subtle px-2 py-1 rounded-xs shadow-sm z-10">
              {shareTip}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-xs flex items-center text-txt-secondary hover:bg-surface hover:text-txt-primary transition-colors duration-[120ms]"
            aria-label="Share"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const MAX_CHARS = 255;
const MAX_COMMENT_CHARS = 500;
const MAX_TOPIC_CUSTOM = 40;
const CUSTOM_TOPIC = "__custom__";
const FALLBACK_TOPICS = [
  "General",
  "Finance",
  "Consulting",
  "Tech",
  "Career",
  "Case prep",
  "Operations",
  "Networking",
  "Fun",
];

export default function App() {
  const [tab, setTab] = useState("new");
  const [yaks, setYaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedError, setFeedError] = useState("");

  const [commentsYak, setCommentsYak] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [topicOptions, setTopicOptions] = useState(FALLBACK_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState("General");
  const [customTopic, setCustomTopic] = useState("");

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
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          const msg =
            typeof data.detail === "string"
              ? data.detail
              : "Could not load feed";
          throw new Error(msg);
        }
        if (!Array.isArray(data)) {
          console.error("Expected array from /yaks, got:", data);
          setYaks([]);
          setFeedError("Unexpected response from server.");
          return;
        }
        setYaks(data);
        setFeedError("");
      })
      .catch((e) => {
        console.error("Failed to load yaks", e);
        setYaks([]);
        setFeedError(e.message || "Failed to load feed. Is the backend running?");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!composing) return;
    setSelectedTopic("General");
    setCustomTopic("");
    fetch(`${API}/topics`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error("topics");
        const names = (data.topics || []).map((t) => t.topic).filter(Boolean);
        setTopicOptions(names.length ? names : FALLBACK_TOPICS);
      })
      .catch(() => setTopicOptions(FALLBACK_TOPICS));
  }, [composing]);

  useEffect(() => {
    if (!commentsYak?.id) return;
    setCommentsLoading(true);
    setCommentsError("");
    setCommentsList([]);
    fetch(`${API}/yaks/${commentsYak.id}/comments`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          const msg = typeof data.detail === "string" ? data.detail : "Failed to load comments";
          throw new Error(msg);
        }
        setCommentsList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        setCommentsError(e.message || "Could not load comments");
      })
      .finally(() => setCommentsLoading(false));
  }, [commentsYak?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !yaks.length) return;
    const hash = window.location.hash;
    const m = /^#yak-(.+)$/.exec(hash);
    if (!m) return;
    const el = document.getElementById(`yak-${m[1]}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [yaks, loading]);

  const closeComments = () => {
    setCommentsYak(null);
    setCommentDraft("");
    setCommentsError("");
    setCommentsList([]);
  };

  const submitComment = async () => {
    const t = commentDraft.trim();
    if (!t || !commentsYak?.id) return;
    setPostingComment(true);
    setCommentsError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/yaks/${commentsYak.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: t }),
      });
      const row = await res.json();
      if (!res.ok) {
        const msg = typeof row.detail === "string" ? row.detail : "Could not post comment";
        throw new Error(msg);
      }
      setCommentsList((prev) => [...prev, row]);
      setCommentDraft("");
      setYaks((prev) =>
        prev.map((y) =>
          y.id === commentsYak.id ? { ...y, comments: (y.comments ?? 0) + 1 } : y
        )
      );
    } catch (e) {
      console.error(e);
      setCommentsError(e.message || "Could not post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const resetCompose = () => {
    setComposing(false);
    setPostText("");
    setSelectedTopic("General");
    setCustomTopic("");
  };

  const handlePost = async () => {
    const trimmed = postText.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    if (selectedTopic === CUSTOM_TOPIC && !customTopic.trim()) return;

    const topic =
      selectedTopic === CUSTOM_TOPIC
        ? customTopic.trim()
        : selectedTopic;

    setPosting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/yaks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: trimmed, topic }),
      });
      if (!res.ok) throw new Error("Post failed");
      const newYak = await res.json();
      setYaks((prev) => [newYak, ...prev]);
      resetCompose();
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
          ) : feedError ? (
            <div className="text-center py-16 px-4 text-body-md text-error-text">
              {feedError}
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
              onOpenComments={(y) => setCommentsYak(y)}
              isLast={i === displayYaks.length - 1}
            />
          ))}
        </div>
        {/* Bottom spacer for FAB */}
        <div className="h-24" />
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setComposing(true)}
        className="fixed bottom-7 right-5 md:right-[calc(50%-280px)] w-14 h-14 liquid-glass-fab flex items-center justify-center z-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444A55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Comments / chat modal */}
      {commentsYak && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/16"
            onClick={() => { if (!postingComment) closeComments(); }}
          />
          <div className="relative w-full sm:max-w-[480px] max-h-[85vh] flex flex-col bg-card border border-[#ECEDEF] sm:rounded-md rounded-t-md shadow-card mx-0 sm:mx-4 animate-toast-in">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0 border-b border-subtle">
              <button
                type="button"
                onClick={() => { if (!postingComment) closeComments(); }}
                className="text-body-sm text-txt-secondary hover:text-txt-primary transition-colors duration-[120ms]"
              >
                Close
              </button>
              <span className="font-semibold text-body-md text-txt-primary">Comments</span>
              <span className="w-12" />
            </div>
            <div className="px-5 py-3 overflow-y-auto flex-1 min-h-0">
              <p className="text-caption text-txt-tertiary mb-2 line-clamp-3">{commentsYak.text}</p>
              {commentsLoading ? (
                <p className="text-body-sm text-txt-secondary py-6 text-center">Loading…</p>
              ) : commentsError && commentsList.length === 0 ? (
                <p className="text-body-sm text-error-text py-4">{commentsError}</p>
              ) : commentsList.length === 0 ? (
                <p className="text-body-sm text-txt-secondary py-6 text-center">No comments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {commentsList.map((c) => (
                    <li key={c.id} className="text-body-sm border-b border-subtle pb-3 last:border-0">
                      <span className="text-caption text-txt-tertiary">
                        {(c.author_name || "Someone")} · {getRelativeTime(c.created_at)} ago
                      </span>
                      <p className="text-txt-primary mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              {commentsError && commentsList.length > 0 ? (
                <p className="text-caption text-error-text mt-2">{commentsError}</p>
              ) : null}
            </div>
            <div className="px-5 pb-4 pt-2 border-t border-subtle shrink-0">
              <textarea
                value={commentDraft}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_COMMENT_CHARS) setCommentDraft(e.target.value);
                }}
                placeholder="Write a reply…"
                rows={2}
                maxLength={MAX_COMMENT_CHARS}
                className="w-full resize-none bg-transparent text-body-md text-txt-primary placeholder:text-placeholder outline-none leading-relaxed border border-subtle rounded-xs px-3 py-2"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-caption text-txt-tertiary font-mono">
                  {commentDraft.length}/{MAX_COMMENT_CHARS}
                </span>
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!commentDraft.trim() || postingComment}
                  className="px-4 py-2 liquid-glass-on-card text-txt-primary text-btn-md font-semibold disabled:opacity-40 disabled:pointer-events-none rounded-xs"
                >
                  {postingComment ? "Sending…" : "Reply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/16"
            onClick={() => { if (!posting) resetCompose(); }}
          />
          <div className="relative w-full sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-card border border-[#ECEDEF] sm:rounded-md rounded-t-md shadow-card mx-0 sm:mx-4 animate-toast-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 sticky top-0 bg-card z-10 border-b border-subtle">
              <button
                type="button"
                onClick={() => { if (!posting) resetCompose(); }}
                className="text-body-sm text-txt-secondary hover:text-txt-primary transition-colors duration-[120ms]"
              >
                Cancel
              </button>
              <span className="font-semibold text-body-md text-txt-primary">New Post</span>
              <button
                type="button"
                onClick={handlePost}
                disabled={
                  !postText.trim()
                  || postText.length > MAX_CHARS
                  || posting
                  || (selectedTopic === CUSTOM_TOPIC && !customTopic.trim())
                }
                className="px-5 py-[6px] liquid-glass-on-card text-txt-primary text-btn-md font-semibold disabled:opacity-40 disabled:pointer-events-none"
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>

            {/* Topic (YikYak-style herd) */}
            <div className="px-5 pt-3 pb-2">
              <p className="text-label-sm text-txt-secondary uppercase tracking-wider mb-2">
                Topic
              </p>
              <p className="text-caption text-txt-tertiary mb-2">
                Pick a category or create a new one — used for leaderboards and discovery.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topicOptions.slice(0, 18).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTopic(t)}
                    className={`px-2.5 py-1 rounded-full text-caption font-medium border transition-colors duration-[120ms] ${
                      selectedTopic === t
                        ? "border-blob-blue bg-blob-blue/12 text-blob-blue"
                        : "border-subtle text-txt-secondary hover:border-txt-secondary hover:text-txt-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedTopic(CUSTOM_TOPIC)}
                  className={`px-2.5 py-1 rounded-full text-caption font-medium border transition-colors duration-[120ms] ${
                    selectedTopic === CUSTOM_TOPIC
                      ? "border-blob-blue bg-blob-blue/12 text-blob-blue"
                      : "border-dashed border-subtle text-txt-secondary hover:border-txt-secondary"
                  }`}
                >
                  + New topic
                </button>
              </div>
              {selectedTopic === CUSTOM_TOPIC ? (
                <input
                  type="text"
                  autoFocus
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value.slice(0, MAX_TOPIC_CUSTOM))}
                  placeholder="Name your topic (e.g. Alumni, VC, Internships)"
                  maxLength={MAX_TOPIC_CUSTOM}
                  className="mt-2 w-full h-9 px-2.5 text-body-sm text-txt-primary bg-card border border-subtle rounded-xs focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus/25"
                />
              ) : null}
            </div>

            {/* Textarea */}
            <div className="px-5 pb-2">
              <label htmlFor="yak-body" className="sr-only">
                Post body
              </label>
              <textarea
                id="yak-body"
                autoFocus={selectedTopic !== CUSTOM_TOPIC}
                value={postText}
                onChange={(e) => {
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
