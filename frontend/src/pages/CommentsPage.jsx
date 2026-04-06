import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { YakCard, getRelativeTime, getAvatarForId, getColorForId, topicFromYak } from "../components/YakCard";
import { CommentThreadList } from "../components/CommentThread";
import { API_BASE } from "../apiBase";

const API = API_BASE;
const MAX_CHARS = 255;

export default function CommentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [yak, setYak] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [replyParent, setReplyParent] = useState(null);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      setCommentsError("");
      try {
        const [yaksRes, commentsRes] = await Promise.all([
          fetch(`${API}/yaks`, { headers }),
          fetch(`${API}/yaks/${id}/comments`, { headers }),
        ]);
        const yaksPayload = await yaksRes.json();
        const commentsPayload = await commentsRes.json();

        if (cancelled) return;

        if (!yaksRes.ok || !Array.isArray(yaksPayload)) {
          const msg =
            typeof yaksPayload?.detail === "string"
              ? yaksPayload.detail
              : "Could not load posts. Is the backend running?";
          setLoadError(msg);
          setYak(null);
          setComments([]);
          return;
        }

        const found = yaksPayload.find((y) => String(y.id) === String(id));
        const normalizedYak = found
          ? { ...found, topic: topicFromYak(found) || null }
          : null;
        setYak(normalizedYak);

        if (!commentsRes.ok) {
          setComments([]);
          const detail =
            typeof commentsPayload?.detail === "string"
              ? commentsPayload.detail
              : "Could not load comments.";
          setCommentsError(detail);
        } else {
          setComments(Array.isArray(commentsPayload) ? commentsPayload : []);
          setCommentsError("");
        }
      } catch (e) {
        console.error("Failed to load data", e);
        if (!cancelled) {
          setLoadError("Failed to load this thread.");
          setYak(null);
          setComments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6 text-txt-secondary text-body-md">
        Invalid thread link.
      </div>
    );
  }

  const handleVote = async (yakId, voteValue, delta) => {
    setYak((prev) => (prev ? { ...prev, votes: prev.votes + delta, user_vote: voteValue } : prev));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/yaks/${yakId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vote_value: voteValue }),
      });
      if (!res.ok) {
        setYak((prev) =>
          prev ? { ...prev, votes: prev.votes - delta, user_vote: voteValue - delta } : prev
        );
      }
    } catch {
      setYak((prev) =>
        prev ? { ...prev, votes: prev.votes - delta, user_vote: voteValue - delta } : prev
      );
    }
  };

  const clearReplyTarget = () => setReplyParent(null);

  const handleComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    setPosting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = { text: trimmed };
      if (replyParent?.id) {
        payload.parent_id = replyParent.id;
      }

      const res = await fetch(`${API}/yaks/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const row = await res.json().catch(() => ({}));
        const detail = typeof row.detail === "string" ? row.detail : "";
        if (res.status === 401) {
          if (token) localStorage.removeItem("token");
          setError(detail || "Please sign in to post comments.");
          return;
        }
        setError(detail || "Failed to post comment. Please try again.");
        return;
      }
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setYak((prev) => (prev ? { ...prev, comments: (prev.comments ?? 0) + 1 } : prev));
      setCommentText("");
      setComposing(false);
      clearReplyTarget();
    } catch (e) {
      console.error("Failed to create comment", e);
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app font-sans relative text-txt-primary">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[380px] h-[380px] rounded-full bg-blob-blue/25 blur-[80px] animate-blob-drift" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blob-soft/35 blur-[70px] animate-blob-drift-2" />
      </div>

      <div className="sticky top-0 z-50 bg-app/60 backdrop-blur-2xl border-b border-white/20">
        <div className="max-w-[600px] mx-auto px-5">
          <div className="flex items-center gap-3.5 h-14">
            <button type="button" onClick={() => navigate("/feed")} className="p-1 group">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-txt-secondary group-hover:text-txt-primary transition-colors duration-[120ms]">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/tamid-logo.png" alt="TaYak" className="w-7 h-7 rounded-xs object-cover" />
              <span className="font-extrabold text-[18px] text-txt-primary tracking-tight">TaYak</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[600px] mx-auto text-txt-primary">
        {loading ? (
          <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
            <div className="text-center text-txt-secondary py-16 text-body-md">
              Loading...
            </div>
          </div>
        ) : loadError && !yak ? (
          <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
            <div className="text-center text-error-text py-16 px-4 text-body-md">
              {loadError}
            </div>
          </div>
        ) : !yak ? (
          <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
            <div className="text-center text-txt-secondary py-16 text-body-md">
              Post not found.
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
              <YakCard
                yak={{
                  ...yak,
                  time: getRelativeTime(yak.created_at),
                  profile_pic: yak.profile_pic || getAvatarForId(yak.id),
                  color: yak.color || getColorForId(yak.id),
                }}
                onVote={handleVote}
                isLast
                hideCommentNav
              />
            </div>

            <div className="mt-3 mx-3 md:mx-0 bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-subtle">
                <span className="font-semibold text-body-sm text-txt-primary">
                  {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                </span>
              </div>
              {commentsError ? (
                <div className="px-5 py-4 text-body-sm text-error-text">
                  {commentsError}
                  <p className="text-caption text-txt-tertiary mt-2">
                    In Supabase → SQL Editor, run <code className="font-mono text-txt-secondary">backend/supabase_yak_comments.sql</code> so the
                    comments table matches the API (including <code className="font-mono">author_name</code>, <code className="font-mono">votes</code>, replies, and vote tracking).
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-txt-secondary py-12 text-body-md">
                  No comments yet. Be the first.
                </div>
              ) : (
                <div className="px-5 py-3">
                  <CommentThreadList
                    comments={comments}
                    setComments={setComments}
                    yakId={id}
                    apiBase={API}
                    onReply={(target) => {
                      setReplyParent(target);
                      setComposing(true);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
        <div className="h-24" />
      </div>

      <button
        type="button"
        onClick={() => {
          setError("");
          clearReplyTarget();
          setComposing(true);
        }}
        className="fixed bottom-7 right-5 md:right-[calc(50%-280px)] w-14 h-14 liquid-glass-fab flex items-center justify-center z-50"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444A55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </button>

      {composing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/16"
            onClick={() => { if (!posting) { setComposing(false); setCommentText(""); clearReplyTarget(); } }}
          />
          <div className="relative w-full sm:max-w-[480px] bg-card border border-[#ECEDEF] sm:rounded-md rounded-t-md shadow-card mx-0 sm:mx-4 animate-toast-in">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button
                type="button"
                onClick={() => { if (!posting) { setComposing(false); setCommentText(""); clearReplyTarget(); } }}
                className="text-body-sm text-txt-secondary hover:text-txt-primary transition-colors duration-[120ms]"
              >
                Cancel
              </button>
              <span className="font-semibold text-body-md text-txt-primary">
                {replyParent ? "Reply" : "New comment"}
              </span>
              <button
                type="button"
                onClick={handleComment}
                disabled={!commentText.trim() || commentText.length > MAX_CHARS || posting}
                className="px-5 py-[6px] liquid-glass-on-card text-txt-primary text-btn-md font-semibold disabled:opacity-40 disabled:pointer-events-none"
              >
                {posting ? "Sending…" : "Send"}
              </button>
            </div>

            {replyParent ? (
              <div className="px-5 pb-2 flex items-start justify-between gap-2">
                <p className="text-caption text-txt-tertiary line-clamp-2 flex-1">
                  Replying to: {replyParent.preview}
                  {replyParent.preview?.length >= 80 ? "…" : ""}
                </p>
                <button type="button" onClick={clearReplyTarget} className="text-caption text-blob-blue shrink-0">
                  Clear
                </button>
              </div>
            ) : null}

            <div className="px-5 pb-2">
              <textarea
                autoFocus
                value={commentText}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setCommentText(e.target.value);
                    if (error) setError("");
                  }
                }}
                placeholder="Write a comment..."
                maxLength={MAX_CHARS}
                rows={4}
                className="w-full resize-none bg-transparent text-body-md text-txt-primary placeholder:text-placeholder outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between px-5 pb-4">
              {error ? (
                <p className="text-caption text-error-text leading-tight max-w-[70%]">{error}</p>
              ) : <span />}
              <span className={`text-caption font-mono ${
                commentText.length > MAX_CHARS * 0.9
                  ? commentText.length >= MAX_CHARS ? "text-error-text" : "text-[#A06A2A]"
                  : "text-txt-tertiary"
              }`}>
                {commentText.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
