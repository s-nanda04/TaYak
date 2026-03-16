import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        navigate("/feed");
      } else {
        setError("Invalid username or password");
      }
    } catch {
      setError("Could not connect to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{
          minHeight: "100vh",
          backgroundColor: "black",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: "50px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div style={{ marginTop: "50px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #FF3B3B, #C0392B)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff" }}>TY</div>
          <span style={{ fontWeight: 800, fontSize: 26, color: "#fff", letterSpacing: -0.3 }}>TaYak</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginTop: "20px" }}>

          {/* Username Group */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <label htmlFor="username" style={{ fontWeight: "bold", color: "white" }}>Enter Email:</label>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                width: "250px"
              }}
            />
          </div>

          {/* Password Group */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <label htmlFor="password" style={{ fontWeight: "bold", color: "white" }}>Enter Password:</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                width: "250px"
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "14px", margin: 0 }}>{error}</p>
          )}

          {/* Login and Signup Buttons */}
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                padding: "12px 30px",
                backgroundColor: loading ? "#888" : "red",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s"
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              style={{
                padding: "12px 30px",
                backgroundColor: "#e53935",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.3s"
              }}
            >
              Signup
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
