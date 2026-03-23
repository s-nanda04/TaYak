import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Leaderboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-app font-sans relative">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[380px] h-[380px] rounded-full bg-blob-blue/25 blur-[80px] animate-blob-drift" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blob-soft/35 blur-[70px] animate-blob-drift-2" />
      </div>

      {/* Top nav */}
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

      {/* Content */}
      <div className="relative z-10 max-w-[600px] mx-auto px-3 md:px-0 pt-4 pb-10">
        {/* Top Contributors */}
        <h2 className="text-body-sm font-semibold text-txt-secondary uppercase tracking-wider mb-3 px-1">Top Contributors</h2>
        <div className="bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden mb-6">
          {topPeople.map((person, index) => (
            <div key={index} className={`flex items-center gap-3 px-4 py-3 ${index < topPeople.length - 1 ? "border-b border-subtle" : ""}`}>
              <span className="text-[20px] w-8 text-center shrink-0">{medals[index]}</span>
              <span className="flex-1 text-body-md text-txt-primary font-medium">{person.name}</span>
              <span className="text-caption text-txt-tertiary">{person.posts} posts</span>
            </div>
          ))}
        </div>

        {/* Top Topics */}
        <h2 className="text-body-sm font-semibold text-txt-secondary uppercase tracking-wider mb-3 px-1">Top Topics</h2>
        <div className="bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden mb-6">
          {topTopics.map((item, index) => (
            <div key={index} className={`flex items-center gap-3 px-4 py-3 ${index < topTopics.length - 1 ? "border-b border-subtle" : ""}`}>
              <span className="text-[20px] w-8 text-center shrink-0">{medals[index]}</span>
              <span className="flex-1 text-body-md text-txt-primary font-medium">{item.topic}</span>
              <span className="text-caption text-txt-tertiary">{item.posts} posts</span>
            </div>
          ))}
        </div>

        {/* Most Upvoted Posts */}
        <h2 className="text-body-sm font-semibold text-txt-secondary uppercase tracking-wider mb-3 px-1">Most Upvoted Posts</h2>
        <div className="bg-card/80 backdrop-blur-sm border border-[#ECEDEF] rounded-md shadow-card overflow-hidden">
          {topPosts.map((post, index) => (
            <div key={index} className={`px-4 py-3 ${index < topPosts.length - 1 ? "border-b border-subtle" : ""}`}>
              <p className="text-body-md text-txt-primary leading-relaxed">{post.text}</p>
              <span className="text-caption text-blob-blue font-bold mt-1.5 inline-block">▲ {post.upvotes} upvotes</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}