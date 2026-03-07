"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");


  return (
    <>
      <div style={{
          minHeight: "100vh",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: "50px"
        }}
      >
        {/* Your existing TaYak header, socials, and bio go here */}
        <div style={{ marginTop: "50px", textAlign: "center" }}>
          <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "green" }}>
            Welcome to TaYak!</h1>
          
        </div>
        {/* --- Start of Form Container --- */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginTop: "20px" }}>
          
          {/* Username Group */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <label htmlFor="username" style={{ fontWeight: "bold" }}>Enter Username:</label>
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
            <label htmlFor="password" style={{ fontWeight: "bold" }}>Enter Password:</label>
            <input
              id="password"
              type="password" // Change to "password" to hide the dots!
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
                width: "250px"
              }}
            />
          </div>

          {/* Login and Signup Buttons */}
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button
              style={{
                padding: "12px 30px",
                backgroundColor: "green",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.3s"
              }}
              
            >
              Login
            </button>
            <button
             
              style={{
                padding: "12px 30px",
                backgroundColor: "#4CAF50",
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
        {/* --- End of Form Container --- */}

      </div>
    </>
  );
}