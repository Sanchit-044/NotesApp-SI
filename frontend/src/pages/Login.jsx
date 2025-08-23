import React, { useState } from "react";

const RAW = import.meta.env.VITE_API_URL || "https://notesapp-si-backend.onrender.com";
const API = RAW.replace(/\/+$/, "");               
const API_BASE = API.endsWith("/api") ? API : `${API}/api`;

export default function Login({ onNavigate, onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const validate = () => {
    const errors = [];
    if (!email) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push("Invalid email format");
    }
    if (!pw) {
      errors.push("Password is required");
    } else if (pw.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    return errors;
  };

  const login = async () => {
    const errors = validate();
    if (errors.length > 0) {
      setMsg(errors.join(", "));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();

      if (data?.token) {
        onLogin(data.token);
        onNavigate("dashboard");
      } else {
        setMsg("Login failed: no token returned");
      }
    } catch (err) {
      setMsg(err.message || "Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-0">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-center mb-8">
          Log in to your account
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />

        <button
          onClick={login}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold shadow-lg transition duration-300"
        >
          Login
        </button>

        {msg && (
          <div className="mt-4 text-center space-y-1">
            {msg.split(", ").map((m, i) => (
              <p key={i} className="text-red-600 text-sm">
                {m}
              </p>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-gray-600">
          Don’t have an account?{" "}
          <button
            onClick={() => onNavigate("signup")}
            className="text-indigo-600 hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
