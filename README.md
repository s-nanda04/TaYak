## TaYak
### Approach

The project follows a full-stack development approach with a Python backend serving a frontend built progressively with HTML, CSS, and JavaScript. Development will be iterative — starting with authentication and core posting features, then adding voting mechanics and leaderboard visualizations.

### Architecture

**User Side:**
- Log in and authenticate to access the platform
- Create posts under existing topics or create new topics
- Upvote and downvote posts from other users
- View leaderboards with Matplotlib-generated graphs
- Track personal stats (posts contributed, interactions)

**Admin Side:**
- Manage topics and moderate posts
- View platform-wide analytics and engagement data
- Remove inappropriate content or users

### Development Practices

- **Git workflows:** Feature branching, pull requests, and code reviews for collaborative development
- **Frontend progression:** HTML/CSS/JS for page structure, styling, and interactivity
- **Backend services:** Python
---

## Project Scope

### User-Facing Features

| Page | Purpose | Features | Users |
|------|---------|----------|-------|
| **Home / Login** | Authentication entry point | User login, signup, session management | All users |
| **Chat / Forum Page** | Main discussion board | Create posts, select existing topic or create new topic, upvote/downvote posts, browse posts by topic | Authenticated users |
| **Leaderboard** | Community and personal stats | Top overall contributors (most posts), top topics (most posts), most upvoted posts — all visualized with Matplotlib graphs | Authenticated users |
| **Personal Leaderboard** | Individual engagement tracking | Top interactions with team members, number of posts contributed | Authenticated users |


**Database Design**
-TBD
