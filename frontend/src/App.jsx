import { useState, useEffect } from "react";

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

const useWindowSize = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
};

const YakCard = ({ yak, onVote, isLast }) => {
  const [userVote, setUserVote] = useState(0);
  const [anim, setAnim] = useState(null);

  const handleVote = (dir) => {
    setAnim(dir);
    setTimeout(() => setAnim(null), 200);
    const nv = userVote === dir ? 0 : dir;
    setUserVote(nv);
    onVote(yak.id, nv - userVote);
  };

  const voteTotal = yak.votes;

  return (
    <div style={{
      padding: "16px 20px",
      borderBottom: isLast ? "none" : "1px solid #1f1f1f",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: `${yak.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, flexShrink: 0,
          border: `2px solid ${yak.color}35`,
        }}>
          {yak.profile_pic}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: "#555", fontSize: 12 }}>{yak.time} ago</span>
          <p style={{
            color: "#e0e0e0", fontSize: 15, lineHeight: 1.55,
            margin: "6px 0 0", wordBreak: "break-word", whiteSpace: "pre-wrap",
          }}>
            {yak.text}
          </p>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 12, paddingLeft: 52,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={() => handleVote(1)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center",
            transform: anim === 1 ? "scale(1.3)" : "scale(1)",
            transition: "all 0.15s ease",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={userVote === 1 ? "#FF3B3B" : "none"} stroke={userVote === 1 ? "#FF3B3B" : "#555"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
          <span style={{
            color: userVote === 1 ? "#FF3B3B" : userVote === -1 ? "#6C47FF" : "#777",
            fontWeight: 700, fontSize: 13, minWidth: 28, textAlign: "center",
            fontFamily: "'SF Mono', monospace",
          }}>
            {voteTotal}
          </span>
          <button onClick={() => handleVote(-1)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center",
            transform: anim === -1 ? "scale(1.3)" : "scale(1)",
            transition: "all 0.15s ease",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={userVote === -1 ? "#6C47FF" : "none"} stroke={userVote === -1 ? "#6C47FF" : "#555"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
        </div>

        <button style={{
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, padding: "5px 8px",
          borderRadius: 6, color: "#555", fontSize: 13,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {yak.comments}
        </button>

        <button style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const w = useWindowSize();
  const isDesktop = w >= 768;
  const [tab, setTab] = useState("new");
  const [yaks, setYaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/yaks`)
      .then(r => r.json())
      .then(data => { setYaks(data); setLoading(false); })
      .catch(e => { console.error("Failed to load yaks", e); setLoading(false); });
  }, []);

  const trendingYaks = [...yaks].sort((a, b) => b.votes - a.votes);
  const newYaks = [...yaks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const displayYaks = tab === "new" ? newYaks : trendingYaks;

  const handleVote = async (id, delta) => {
    setYaks(prev => prev.map(y => y.id === id ? { ...y, votes: y.votes + delta } : y));
    try {
      await fetch(`${API}/yaks/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } catch (e) {
      console.error("Vote failed", e);
      setYaks(prev => prev.map(y => y.id === id ? { ...y, votes: y.votes - delta } : y));
    }
  };

  const feedMaxWidth = isDesktop ? 600 : "100%";

  return (
    <div style={{
      background: "#0a0a0a", minHeight: "100vh", color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* TOP NAV */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#0a0a0aee", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1f1f1f",
      }}>
        <div style={{
          maxWidth: isDesktop ? 600 : "100%",
          margin: "0 auto",
          padding: "0 20px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
          }}>
            {/* Left: hamburger + logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 4, display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span style={{ width: 22, height: 2, background: "#ccc", borderRadius: 2, display: "block" }}/>
                <span style={{ width: 22, height: 2, background: "#ccc", borderRadius: 2, display: "block" }}/>
                <span style={{ width: 22, height: 2, background: "#ccc", borderRadius: 2, display: "block" }}/>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #FF3B3B, #C0392B)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 13,
                }}>TY</div>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>TaYak</span>
              </div>
            </div>

            {/* Right: Unread | Trending tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {[
                { key: "new", label: "Unread" },
                { key: "trending", label: "Trending" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  background: "transparent", border: "none",
                  cursor: "pointer", padding: "6px 14px",
                  fontSize: 14, fontWeight: 600,
                  color: tab === t.key ? "#ffffff" : "#555",
                  transition: "color 0.2s ease",
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEED */}
      <div style={{
        maxWidth: isDesktop ? 600 : "100%",
        margin: "0 auto",
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0", fontSize: 14 }}>
            Loading yaks...
          </div>
        ) : displayYaks.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0", fontSize: 14 }}>
            No yaks yet. Be the first.
          </div>
        ) : displayYaks.map((yak, i) => (
          <YakCard
            key={yak.id}
            yak={{ ...yak, time: getRelativeTime(yak.created_at) }}
            onVote={handleVote}
            isLast={i === displayYaks.length - 1}
          />
        ))}
      </div>

      {/* FAB - New Yak Button (no compose implementation) */}
      <button style={{
        position: "fixed",
        bottom: 28,
        right: isDesktop ? "calc(50% - 320px)" : 20,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #FF3B3B, #C0392B)",
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 20px #FF3B3B55",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 28px #FF3B3B77"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px #FF3B3B55"; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        *{-webkit-tap-highlight-color:transparent; box-sizing:border-box;}
        ::-webkit-scrollbar{width:0px}
        button:active{opacity:0.7}
        body{margin:0;padding:0;background:#0a0a0a}
      `}</style>
    </div>
  );
}