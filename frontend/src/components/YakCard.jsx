import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AVATARS = ["\u{1F9AC}", "\u{1F43B}", "\u{1F98A}", "\u{1F438}", "\u{1F42F}", "\u{1F981}", "\u{1F43C}", "\u{1F428}", "\u{1F435}", "\u{1F984}", "\u{1F436}", "\u{1F431}"];
export const COLORS = ["#2F79F7", "#5A2FD4", "#E5484D", "#30A46C", "#E38B2F", "#3B82F6", "#8B5CF6", "#EC4899"];

export const getRelativeTime = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export const getAvatarForId = (id) => {
  const hash = (id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATARS[hash % AVATARS.length];
};

export const getColorForId = (id) => {
  const hash = (id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

export const YakCard = ({ yak, onVote, isLast, hideCommentNav }) => {
  const navigate = useNavigate();
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
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[19px] shrink-0 border-2"
          style={{
            background: `${yak.color}12`,
            borderColor: `${yak.color}30`,
          }}
        >
          {yak.profile_pic}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-caption text-txt-tertiary">{yak.time} ago</span>
          <p className="text-body-md text-txt-primary mt-1 break-words whitespace-pre-wrap leading-relaxed">
            {yak.text}
          </p>
        </div>
      </div>

      <div className="flex items-center mt-3 pl-[52px]">
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

        <button
          onClick={() => !hideCommentNav && navigate(`/yak/${yak.id}`)}
          className="ml-4 flex items-center gap-1.5 px-2 py-1.5 rounded-xs text-body-sm text-txt-secondary hover:bg-surface hover:text-txt-primary transition-colors duration-[120ms]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {yak.comments}
        </button>

      </div>
    </div>
  );
};

export default YakCard;
