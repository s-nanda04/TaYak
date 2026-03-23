import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem("token", session.access_token);
        navigate("/feed", { replace: true });
      }
    });

    // Fallback: if no session arrives within 5s, send back to login
    const timeout = setTimeout(() => navigate("/", { replace: true }), 5000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center font-sans">
      <div className="relative w-full h-full min-h-screen overflow-hidden flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-blob-blue/40 blur-[80px] animate-blob-drift" />
          <div className="absolute bottom-1/4 left-1/3 w-[340px] h-[340px] rounded-full bg-blob-soft/50 blur-[70px] animate-blob-drift-2" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-8 h-8 border-2 border-txt-secondary border-t-txt-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-md text-txt-secondary">Signing you in...</p>
        </div>
      </div>
    </div>
  );
}
