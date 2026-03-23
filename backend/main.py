import os
from collections import Counter
from pathlib import Path
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI(title="TaYak API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class LoginRequest(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class ResendRequest(BaseModel):
    email: str


class VoteRequest(BaseModel):
    vote_value: int  # 1 (upvote), -1 (downvote), or 0 (remove vote)


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
    Supabase sends a confirmation email automatically when confirm_email is enabled.
    """
    try:
        response = supabase.auth.sign_up(
            {
                "email": body.email,
                "password": body.password,
            }
        )
        if response.user:
            needs_confirmation = response.session is None
            return {
                "success": True,
                "user_id": response.user.id,
                "needs_email_confirmation": needs_confirmation,
            }
    except Exception as e:
        error_msg = str(e).lower()
        print(f"Supabase signup error (type={type(e).__name__}): {e}")
        print(f"Supabase signup error repr: {repr(e)}")
        if "already registered" in error_msg or "already been registered" in error_msg:
            raise HTTPException(status_code=400, detail="An account with this email already exists") from e
        raise HTTPException(status_code=400, detail=f"Signup failed: {e}") from e
    return {"success": False, "error": "Signup failed"}


@app.post("/resend-confirmation")
def resend_confirmation(body: ResendRequest):
    """Resend the Supabase Auth confirmation email."""
    try:
        supabase.auth.resend({"type": "signup", "email": body.email})
        return {"success": True}
    except Exception as e:
        print(f"Resend confirmation error: {e}")
        return {"success": False, "error": "Could not resend confirmation email"}


@app.post("/login")
def login(body: LoginRequest):
    try:
        email = body.username
        response = supabase.auth.sign_in_with_password(
            {"email": email, "password": body.password}
        )
        if response.user and response.session:
            return {
                "success": True,
                "token": response.session.access_token,
                "user_id": response.user.id,
                "email": response.user.email,
            }
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        print(f"Supabase login error: {e}")
        if "email not confirmed" in error_msg:
            raise HTTPException(
                status_code=403,
                detail="Please confirm your email before signing in",
            ) from e
        if "invalid" in error_msg and ("credentials" in error_msg or "login" in error_msg):
            raise HTTPException(
                status_code=401, detail="Invalid email or password"
            ) from e
        raise HTTPException(
            status_code=401, detail="Invalid email or password"
        ) from e


def get_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    try:
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            return user_resp.user.id
    except Exception as e:
        print(f"Token verification failed: {e}")
    return None


@app.get("/yaks")
def get_yaks(authorization: Optional[str] = Header(None)):
    try:
        response = supabase.table("yaks").select("*").order("created_at", desc=True).execute()
        yaks = response.data

        user_id = get_user_id_from_token(authorization)
        if user_id:
            votes_resp = (
                supabase.table("yak_votes")
                .select("yak_id, vote_value")
                .eq("user_id", user_id)
                .execute()
            )
            user_votes = {v["yak_id"]: v["vote_value"] for v in (votes_resp.data or [])}
            for yak in yaks:
                yak["user_vote"] = user_votes.get(yak["id"], 0)
        else:
            for yak in yaks:
                yak["user_vote"] = 0

        return yaks
    except Exception as e:
        print(f"Error fetching yaks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch yaks") from e


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
        raise HTTPException(status_code=500, detail="Failed to create yak") from e


@app.post("/yaks/{yak_id}/vote")
def vote_yak(yak_id: str, body: VoteRequest, authorization: Optional[str] = Header(None)):
    if body.vote_value not in (-1, 0, 1):
        raise HTTPException(status_code=400, detail="vote_value must be -1, 0, or 1")

    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to vote")

    try:
        yak_check = supabase.table("yaks").select("id").eq("id", yak_id).single().execute()
        if not yak_check.data:
            raise HTTPException(status_code=404, detail="Yak not found")

        if body.vote_value == 0:
            supabase.table("yak_votes").delete().eq("user_id", user_id).eq("yak_id", yak_id).execute()
        else:
            supabase.table("yak_votes").upsert(
                {"user_id": user_id, "yak_id": yak_id, "vote_value": body.vote_value},
                on_conflict="user_id,yak_id",
            ).execute()

        votes_sum_resp = (
            supabase.table("yak_votes")
            .select("vote_value")
            .eq("yak_id", yak_id)
            .execute()
        )
        new_votes = sum(v["vote_value"] for v in (votes_sum_resp.data or []))
        supabase.table("yaks").update({"votes": new_votes}).eq("id", yak_id).execute()

        return {"success": True, "votes": new_votes}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error voting: {e}")
        raise HTTPException(status_code=500, detail="Failed to update vote") from e


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
        raise HTTPException(status_code=500, detail="Failed to build leaderboard") from e

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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

