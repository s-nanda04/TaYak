import { useState, useEffect } from "react";
import { getRelativeTime, getAvatarForId, getColorForId } from "./YakCard";

/** Build a tree of { ...comment, replies: [...] } from a flat API list. */
export function nestComments(flat) {
  if (!Array.isArray(flat) || !flat.length) return [];
  const byId = new Map(flat.map((c) => [c.id, { ...c, replies: [] }]));
  const roots = [];
  for (const c of flat) {
    const node = byId.get(c.id);
    const pid = c.parent_id;
    if (pid && byId.has(pid)) {
      byId.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortFn = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  const walk = (n) => {
    n.replies.sort(sortFn);
    n.replies.forEach(walk);
  };
  roots.sort(sortFn);
  roots.forEach(walk);
  return roots;
}

function authorLabel(c) {
  return (c.author_name || c.author || "Someone").trim() || "Someone";
}

function CommentRow({
  node,
  depth,
  yakId,
  apiBase,
  onReply,
  patchComment,
}) {
  const [userVote, setUserVote] = useState(node.user_vote || 0);
  const [voteCount, setVoteCount] = useState(node.votes ?? 0);
  const [anim, setAnim] = useState(null);

  useEffect(() => {
    setUserVote(node.user_vote || 0);
    setVoteCount(node.votes ?? 0);
  }, [node.id, node.user_vote, node.votes]);

  const handleVote = async (dir) => {
    const tokenNow = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenNow) return;
    const newVote = userVote === dir ? 0 : dir;
    const prevVote = userVote;
    setAnim(dir);
    setTimeout(() => setAnim(null), 180);
    setUserVote(newVote);
    try {
      const res = await fetch(`${apiBase}/yaks/${yakId}/comments/${node.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenNow}`,
        },
        body: JSON.stringify({ vote_value: newVote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUserVote(prevVote);
        if (res.status === 401) {
          localStorage.removeItem("token");
        }
        return;
      }
      if (typeof data.votes === "number") {
        setVoteCount(data.votes);
        patchComment(node.id, data.votes, newVote);
      }
    } catch {
      setUserVote(prevVote);
    }
  };

  const pic = getAvatarForId(String(node.id));
  const color = getColorForId(String(node.id));
  const hasToken = typeof localStorage !== "undefined" && !!localStorage.getItem("token");

  return (
    <div
      className={`${depth > 0 ? "mt-2 pl-3 border-l-2 border-subtle" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] shrink-0 border-2"
          style={{
            background: `${color}12`,
            borderColor: `${color}30`,
          }}
        >
          {pic}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-caption font-medium text-txt-secondary">{authorLabel(node)}</span>
            <span className="text-caption text-txt-tertiary">{getRelativeTime(node.created_at)} ago</span>
          </div>
          <p className="text-body-sm text-txt-primary mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
            {node.text}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                disabled={!hasToken}
                title={hasToken ? "Upvote" : "Sign in to vote"}
                onClick={() => handleVote(1)}
                className="p-1 rounded-xs hover:bg-surface disabled:opacity-35 transition-colors"
                style={{ transform: anim === 1 ? "scale(1.15)" : "scale(1)", transition: "transform 140ms ease" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={userVote === 1 ? "#2F79F7" : "none"} stroke={userVote === 1 ? "#2F79F7" : "#8D9098"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
              <span className={`text-caption font-mono min-w-[1.25rem] text-center ${
                userVote === 1 ? "text-blob-blue" : userVote === -1 ? "text-violet-edge" : "text-txt-tertiary"
              }`}>
                {voteCount}
              </span>
              <button
                type="button"
                disabled={!hasToken}
                title={hasToken ? "Downvote" : "Sign in to vote"}
                onClick={() => handleVote(-1)}
                className="p-1 rounded-xs hover:bg-surface disabled:opacity-35 transition-colors"
                style={{ transform: anim === -1 ? "scale(1.15)" : "scale(1)", transition: "transform 140ms ease" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={userVote === -1 ? "#5A2FD4" : "none"} stroke={userVote === -1 ? "#5A2FD4" : "#8D9098"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onReply?.({ id: node.id, preview: (node.text || "").slice(0, 80) })}
              className="text-caption font-medium text-blob-blue hover:underline"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      {node.replies?.length > 0 ? (
        <div className="space-y-0">
          {node.replies.map((ch) => (
            <CommentRow
              key={ch.id}
              node={ch}
              depth={depth + 1}
              yakId={yakId}
              apiBase={apiBase}
              onReply={onReply}
              patchComment={patchComment}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array} props.comments — flat list from API
 * @param {function} props.setComments — React setState for flat list
 * @param {string} props.yakId
 * @param {string} props.apiBase
 * @param {function} [props.onReply] — ({ id, preview }) => void
 */
export function CommentThreadList({ comments, setComments, yakId, apiBase, onReply }) {
  const tree = nestComments(comments);

  const patchComment = (id, votes, user_vote) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes, user_vote } : c))
    );
  };

  if (!comments.length) return null;

  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <div key={node.id} className="border-b border-subtle pb-3 last:border-0">
          <CommentRow
            node={node}
            depth={0}
            yakId={yakId}
            apiBase={apiBase}
            onReply={onReply}
            patchComment={patchComment}
          />
        </div>
      ))}
    </div>
  );
}
