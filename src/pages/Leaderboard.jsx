import { Link } from "react-router-dom";

export default function Leaderboard() {

  // hardcoded data for now, replace with real Supabase data later
  const topPeople = [
    { name: "Shaurya", posts: 34 },
    { name: "Rio",     posts: 28 },
    { name: "Vanessa", posts: 22 },
    { name: "Shreya",  posts: 17 },
  ];

  const topTopics = [
    { topic: "Finance",     posts: 47 },
    { topic: "Consulting",  posts: 38 },
    { topic: "Tech",        posts: 31 },
    { topic: "Career Tips", posts: 19 },
  ];

  const topPosts = [
    { text: "The carry trade strategy explained simply...", upvotes: 64 },
    { text: "3 frameworks that helped me ace my case interview...", upvotes: 51 },
    { text: "Why most Series A pitches fail at unit economics...", upvotes: 43 },
  ];

  const medals = ["🥇", "🥈", "🥉", "4."];

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "20px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #FF3B3B, #C0392B)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>TY</div>
          <span style={{ fontWeight: 800, fontSize: 18 }}>TaYak — Leaderboard</span>
        </div>
        {/* Back to feed link */}
        <Link to="/" style={{ color: "#FF3B3B", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
          ← Feed
        </Link>
      </div>

      <hr style={{ borderColor: "#1f1f1f", marginBottom: 28 }} />

      {/* ── Top Contributors ── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#aaa", marginBottom: 12 }}>🏆 Top Contributors</h2>
      {topPeople.map((person, index) => (
        <div key={index} style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>{medals[index]}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{person.name}</span>
          <span style={{ color: "#555", fontSize: 13 }}>{person.posts} posts</span>
        </div>
      ))}

      {/* ── Top Topics ── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#aaa", marginBottom: 12, marginTop: 32 }}>🔥 Top Topics</h2>
      {topTopics.map((item, index) => (
        <div key={index} style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>{medals[index]}</span>
          <span style={{ flex: 1, fontWeight: 500 }}>{item.topic}</span>
          <span style={{ color: "#555", fontSize: 13 }}>{item.posts} posts</span>
        </div>
      ))}

      {/* ── Most Upvoted Posts ── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#aaa", marginBottom: 12, marginTop: 32 }}>⬆️ Most Upvoted Posts</h2>
      {topPosts.map((post, index) => (
        <div key={index} style={{ background: "#1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
          <p style={{ margin: "0 0 8px", color: "#e0e0e0", fontSize: 14, lineHeight: 1.5 }}>{post.text}</p>
          <span style={{ color: "#FF3B3B", fontWeight: 700, fontSize: 13 }}>▲ {post.upvotes} upvotes</span>
        </div>
      ))}

      <style>{`* { box-sizing: border-box; } body { margin: 0; background: #0a0a0a; }`}</style>
    </div>
  );
}