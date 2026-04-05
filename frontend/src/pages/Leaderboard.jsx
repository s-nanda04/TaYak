import React, { useEffect, useState } from 'react'
import supabase from '../supabaseClient'

export default function Leaderboard() {
  const [loading, setLoading] = useState(true)
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadLeaderboard() {
      setLoading(true)
      // Fetch all profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')       // adjust if your user table is named differently
        .select('id, username, avatar_url')

      if (pErr) {
        console.error('profiles error', pErr)
        setLoading(false)
        return
      }

      // Fetch all posts (only need author/user id)
      const { data: posts, error: postsErr } = await supabase
        .from('posts')          // adjust if your posts table has another name
        .select('id, author')   // adjust 'author' to the FK column that references profiles.id

      if (postsErr) {
        console.error('posts error', postsErr)
        setLoading(false)
        return
      }

      // Count posts per author id
      const counts = {}
      (posts || []).forEach(p => {
        const author = p.author || p.user_id || p.owner
        if (!author) return
        counts[author] = (counts[author] || 0) + 1
      })

      // Merge profiles with counts (ensure every profile appears)
      const merged = (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username || profile.name || 'Unknown',
        avatar_url: profile.avatar_url || null,
        postCount: counts[profile.id] || 0,
      }))

      // Optionally include contributors who posted but have no profile record:
      Object.keys(counts).forEach(authorId => {
        if (!merged.find(m => m.id === authorId)) {
          merged.push({
            id: authorId,
            username: 'Unknown',
            avatar_url: null,
            postCount: counts[authorId],
          })
        }
      })

      // Sort by postCount desc
      merged.sort((a, b) => b.postCount - a.postCount)

      if (mounted) {
        setLeaders(merged)
        setLoading(false)
      }
    }

    loadLeaderboard()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading leaderboard…</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Top Contributors</h2>
      <div className="space-y-2">
        {leaders.map((u, idx) => (
          <div key={u.id || idx} className="flex items-center justify-between p-3 bg-white rounded shadow-sm">
            <div className="flex items-center space-x-3">
              {u.avatar_url
                ? <img src={u.avatar_url} alt={u.username} className="w-10 h-10 rounded-full" />
                : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">{(u.username||'U')[0]}</div>
              }
              <div>
                <div className="font-medium">{u.username}</div>
                <div className="text-sm text-gray-500">ID: {u.id}</div>
              </div>
            </div>
            <div className="text-sm text-blue-600 font-semibold">{u.postCount} post{u.postCount !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}