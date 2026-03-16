from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

SUPABASE_URL = "https://qricbqkijksggyyrepnz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaWNicWtpamtzZ2d5eXJlcG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NzA4MzAsImV4cCI6MjA4OTI0NjgzMH0.dUVuEhy2x5dAxniB3O2iY3jrQws7ieX-kgUL6haV-ck"

app = FastAPI()

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


class VoteRequest(BaseModel):
    delta: int


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
