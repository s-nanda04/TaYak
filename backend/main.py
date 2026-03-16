import os
from collections import Counter
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
"""
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")
"""
app = FastAPI(title="TaYak API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class VoteRequest(BaseModel):
    delta: int


class YakCreate(BaseModel):
    text: str
    topic: Optional[str] = None
    author_name: Optional[str] = None


class LeaderboardResponse(BaseModel):
    top_contributors: List[dict]
    top_topics: List[dict]
    top_posts: List[dict]


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/signup")
def signup(body: SignupRequest):
    """
    Create a new user in Supabase Auth.
    """
    try:
        response = supabase.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
            }
        )
        if response.user:
            return {"success": True, "user_id": response.user.id}
    except Exception as e:
        print(f"Supabase signup error: {e}")
        raise HTTPException(status_code=400, detail="Signup failed")
    return {"success": False, "error": "Signup failed"}


@app.post("/login")
def login(body: LoginRequest):
    try:
        email = body.username
        print(f"Attempting login for: {email}")
        response = supabase.auth.sign_in_with_password({"email": email, "password": body.password})
        print(f"Supabase response user: {response.user}")
        if response.user:
            return {"success": True, "token": response.session.access_token}
    except Exception as e:
        print(f"Supabase error: {e}")
    return {"success": False, "error": "Invalid username or password"}


@app.get("/yaks")
def get_yaks():
    try:
        response = supabase.table("yaks").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching yaks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch yaks")


@app.post("/yaks")
def create_yak(body: YakCreate):
    """
    Create a new yak (post).

    Expected Supabase `yaks` table columns:
    - id (uuid, default)
    - text (text)
    - topic (text, nullable)
    - author_name (text, nullable)
    - votes (int, default 0)
    - comments (int, default 0)
    - created_at (timestamp with time zone, default now())
    """
    try:
        payload = {
            "text": body.text,
            "topic": body.topic,
            "author_name": body.author_name,
        }
        response = supabase.table("yaks").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create yak")
        return response.data[0]
    except Exception as e:
        print(f"Error creating yak: {e}")
        raise HTTPException(status_code=500, detail="Failed to create yak")


@app.post("/yaks/{yak_id}/vote")
def vote_yak(yak_id: str, body: VoteRequest):
    if body.delta not in (-2, -1, 0, 1, 2):
        raise HTTPException(status_code=400, detail="Invalid delta")
    try:
        result = supabase.table("yaks").select("votes").eq("id", yak_id).single().execute()
        current_votes = result.data["votes"]
        new_votes = current_votes + body.delta
        supabase.table("yaks").update({"votes": new_votes}).eq("id", yak_id).execute()
        return {"success": True, "votes": new_votes}
    except Exception as e:
        print(f"Error voting: {e}")
        raise HTTPException(status_code=500, detail="Failed to update vote")


@app.get("/leaderboard", response_model=LeaderboardResponse)
def leaderboard():
    """
    Uses all rows in `yaks` to build:
    - top_contributors (by author_name)
    - top_topics (by topic)
    - top_posts (by votes)
    """
    try:
        response = supabase.table("yaks").select("*").execute()
        yaks = response.data or []
    except Exception as e:
        print(f"Error fetching yaks for leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to build leaderboard")

    contributor_counter: Counter[str] = Counter()
    topic_counter: Counter[str] = Counter()

    for yak in yaks:
        author_name = yak.get("author_name") or "Unknown"
        topic = yak.get("topic") or "General"
        contributor_counter[author_name] += 1
        topic_counter[topic] += 1

    top_contributors = [
        {"name": name, "posts": count}
        for name, count in contributor_counter.most_common(10)
    ]
    top_topics = [
        {"topic": topic, "posts": count}
        for topic, count in topic_counter.most_common(10)
    ]

    top_posts = sorted(
        [
            {
                "id": yak.get("id"),
                "text": yak.get("text"),
                "votes": yak.get("votes", 0),
            }
            for yak in yaks
        ],
        key=lambda x: x["votes"],
        reverse=True,
    )[:10]

    return LeaderboardResponse(
        top_contributors=top_contributors,
        top_topics=top_topics,
        top_posts=top_posts,
    )

