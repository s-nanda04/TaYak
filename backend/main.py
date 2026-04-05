import html
import json
import os
import socket
from collections import Counter
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import uvicorn
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")


def _normalize_supabase_url(raw: str) -> str:
    """Strip junk that breaks DNS (BOM, zero-width chars, double scheme)."""
    s = (raw or "").strip().strip('"').strip("'")
    s = s.replace("\ufeff", "").replace("\u200b", "").replace("\u200c", "")
    s = s.replace("\r", "").replace("\n", "").strip()
    while "https://https://" in s:
        s = s.replace("https://https://", "https://")
    while "http://https://" in s:
        s = s.replace("http://https://", "https://")
    return s.strip()


SUPABASE_URL = _normalize_supabase_url(os.getenv("SUPABASE_URL") or "")
SUPABASE_KEY = (os.getenv("SUPABASE_KEY") or "").strip().strip('"').strip("'")

app = FastAPI(title="TaYak API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in the environment")

_parsed = urlparse(SUPABASE_URL)
if _parsed.scheme not in ("https", "http") or not _parsed.hostname:
    raise RuntimeError(
        "SUPABASE_URL must look like https://YOUR_PROJECT_REF.supabase.co "
        "(copy it from Supabase → Settings → API → Project URL). "
        "No spaces, quotes, or line breaks."
    )

try:
    socket.getaddrinfo(_parsed.hostname, 443, type=socket.SOCK_STREAM)
except socket.gaierror as e:
    raise RuntimeError(
        f"Cannot resolve Supabase host {_parsed.hostname!r} ({e}). "
        "Copy Project URL again from Supabase → Settings → API (must end in .supabase.co). "
        "Check for typos, extra spaces, or offline DNS/VPN."
    ) from e

print(
    f"[TaYak] Supabase REST host: {_parsed.hostname!r} "
    f"(len={len(_parsed.hostname)}, ends_with_supabase_co={str(_parsed.hostname).endswith('.supabase.co')})"
)

if not SUPABASE_KEY.startswith("eyJ"):
    print(
        "WARNING: SUPABASE_KEY should be the anon public JWT from Supabase → Settings → API "
        "(starts with eyJ...). The sb_publishable_ key is not valid for the Python/PostgREST client."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print(f"[TaYak] Loaded main.py from: {Path(__file__).resolve()}")


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


class CommentCreate(BaseModel):
    text: str


class YakCreate(BaseModel):
    text: str
    topic: Optional[str] = None
    author_name: Optional[str] = None


class LeaderboardResponse(BaseModel):
    top_contributors: List[dict]
    top_topics: List[dict]
    top_posts: List[dict]


# Shown in GET /topics even before anyone posts; merged with topics from the DB.
DEFAULT_TOPIC_SEEDS: List[str] = [
    "General",
    "Finance",
    "Consulting",
    "Tech",
    "Career",
    "Case prep",
    "Operations",
    "Networking",
    "Product",
    "Fun",
]


_ROOT_LINKS = {
    "service": "TaYak API",
    "docs": "/docs",
    "health": "/health",
    "health_supabase": "/health/supabase",
    "topics": "/topics",
    "openapi_json": "/openapi.json",
}


def _root_html_page() -> str:
    block = html.escape(json.dumps(_ROOT_LINKS, indent=2))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>TaYak API</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; color: #111; }}
    h1 {{ font-size: 1.5rem; }}
    ul {{ line-height: 2; padding-left: 1.2rem; }}
    a {{ color: #2563eb; }}
    pre {{ background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow: auto; font-size: 0.85rem; }}
    p.note {{ color: #52525b; font-size: 0.9rem; }}
  </style>
</head>
<body>
  <h1>TaYak API</h1>
  <p>Backend is running. Quick links:</p>
  <ul>
    <li><a href="/docs">Interactive docs (Swagger)</a></li>
    <li><a href="/health">GET /health</a></li>
    <li><a href="/health/supabase">GET /health/supabase</a> (DNS / Supabase host check)</li>
    <li><a href="/topics">GET /topics</a> (compose / herd list)</li>
    <li><a href="/openapi.json">OpenAPI JSON</a></li>
  </ul>
  <p class="note">If this page is still blank, hard-refresh (Cmd+Shift+R) or try an incognito window.
  Check the uvicorn terminal for: <code>[TaYak] Loaded main.py from: …</code></p>
  <pre>{block}</pre>
</body>
</html>"""


@app.get("/")
def root(request: Request):
    """HTML in browsers; JSON for tools that send Accept: application/json."""
    accept = request.headers.get("accept", "") or ""
    first = accept.split(",")[0].strip() if accept else ""
    if first.startswith("application/json"):
        return JSONResponse(_ROOT_LINKS)
    return HTMLResponse(content=_root_html_page())


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/supabase")
def health_supabase():
    """Debug DNS / URL issues (host only; no secrets)."""
    host = _parsed.hostname or ""
    try:
        socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        dns = "ok"
    except socket.gaierror as e:
        dns = f"fail: {e}"
    return {
        "supabase_host": host,
        "host_char_codes_sample": [ord(c) for c in host[:40]],
        "dns_lookup_443": dns,
        "hint": "Must match Project URL in Supabase → Settings → API (e.g. xxxxx.supabase.co).",
    }


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
            payload = {
                "success": True,
                "user_id": response.user.id,
                "needs_email_confirmation": needs_confirmation,
            }
            if response.session:
                payload["token"] = response.session.access_token
            return payload
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


def get_user_email_from_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    try:
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user and user_resp.user.email:
            return user_resp.user.email
    except Exception as e:
        print(f"Token email lookup failed: {e}")
    return None


@app.get("/yaks")
def get_yaks(authorization: Optional[str] = Header(None)):
    try:
        response = supabase.table("yaks").select("*").order("created_at", desc=True).execute()
        yaks = response.data or []

        user_id = get_user_id_from_token(authorization)
        user_votes: dict = {}
        if user_id:
            try:
                votes_resp = (
                    supabase.table("yak_votes")
                    .select("yak_id, vote_value")
                    .eq("user_id", user_id)
                    .execute()
                )
                user_votes = {
                    v["yak_id"]: v["vote_value"] for v in (votes_resp.data or [])
                }
            except Exception as e:
                # Table missing, RLS, etc. — still return the feed without per-user votes
                print(f"yak_votes lookup skipped: {e}")

        for yak in yaks:
            yak["user_vote"] = user_votes.get(yak["id"], 0) if user_id else 0

        return yaks
    except Exception as e:
        err = str(e).lower()
        print(f"Error fetching yaks: {e}")
        detail = "Failed to fetch yaks."
        if "nodename nor servname" in err or "errno 8" in err or "gaierror" in err:
            detail += (
                " Your machine cannot reach Supabase (bad SUPABASE_URL host or no DNS). "
                "Fix backend/.env Project URL from Settings → API."
            )
        elif any(
            x in err
            for x in (
                "row level security",
                "rls",
                "permission denied",
                "42501",
                "pgrst",
                "jwt",
            )
        ):
            detail += (
                " Supabase is probably blocking reads (RLS). In the SQL Editor, run "
                "backend/supabase_policies.sql, or use service_role in backend/.env only."
            )
        else:
            detail += f" ({str(e)[:180]})"
        raise HTTPException(status_code=500, detail=detail) from e


@app.get("/topics")
def list_topics():
    """
    Topics for the compose UI: seed list plus any topic strings already used on yaks,
    with post counts (for ordering popular herds first).
    """
    try:
        response = supabase.table("yaks").select("topic").execute()
        rows = response.data or []
        counts: Counter[str] = Counter()
        for row in rows:
            raw = (row.get("topic") or "").strip()
            key = raw if raw else "General"
            counts[key] += 1
        for seed in DEFAULT_TOPIC_SEEDS:
            counts.setdefault(seed, 0)
        items = [{"topic": k, "posts": v} for k, v in counts.items()]
        items.sort(key=lambda x: (-x["posts"], x["topic"].lower()))
        return {"topics": items}
    except Exception as e:
        print(f"Error listing topics: {e}")
        raise HTTPException(status_code=500, detail="Failed to list topics") from e


@app.post("/yaks")
def create_yak(body: YakCreate, authorization: Optional[str] = Header(None)):
    """
    Create a new yak (post).

    Leaderboard counts posts per `author_name`. If the client omits it, we set
    `author_name` from the JWT (user email) so contributors show up correctly.

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
        author_name = body.author_name
        if author_name is None:
            author_name = get_user_email_from_token(authorization)

        topic_val = (body.topic or "").strip()
        if len(topic_val) > 80:
            topic_val = topic_val[:80]
        if not topic_val:
            topic_val = None

        payload = {
            "text": body.text,
            "topic": topic_val,
            "author_name": author_name,
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


@app.get("/yaks/{yak_id}/comments")
def get_yak_comments(yak_id: str):
    try:
        chk = supabase.table("yaks").select("id").eq("id", yak_id).limit(1).execute()
        if not chk.data:
            raise HTTPException(status_code=404, detail="Yak not found")
        r = (
            supabase.table("yak_comments")
            .select("id, yak_id, text, author_name, created_at")
            .eq("yak_id", yak_id)
            .order("created_at", desc=False)
            .execute()
        )
        return r.data or []
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments") from e


@app.post("/yaks/{yak_id}/comments")
def post_yak_comment(
    yak_id: str,
    body: CommentCreate,
    authorization: Optional[str] = Header(None),
):
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text is required")
    if len(text) > 1000:
        raise HTTPException(status_code=400, detail="Comment too long")

    author_name = get_user_email_from_token(authorization) or "Anonymous"

    try:
        yak_check = supabase.table("yaks").select("id, comments").eq("id", yak_id).single().execute()
        if not yak_check.data:
            raise HTTPException(status_code=404, detail="Yak not found")

        ins = (
            supabase.table("yak_comments")
            .insert({"yak_id": yak_id, "text": text, "author_name": author_name})
            .execute()
        )
        if not ins.data:
            raise HTTPException(status_code=500, detail="Failed to post comment")

        try:
            prev = yak_check.data.get("comments") or 0
            supabase.table("yaks").update({"comments": prev + 1}).eq("id", yak_id).execute()
        except Exception as bump_err:
            print(f"Comment count bump skipped: {bump_err}")

        return ins.data[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error posting comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to post comment") from e


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

