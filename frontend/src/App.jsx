import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PublicNotes from "./pages/PublicNotes";
import Home from "./pages/Home";
import Workspaces from "./pages/Workspaces";

function App() {
  const [route, setRoute] = useState(localStorage.getItem("route") || "home");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [currentUser, setCurrentUser] = useState(null); 

  const loggedIn = !!token;

  useEffect(() => {
    localStorage.setItem("route", route);
  }, [route]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    const RAW = import.meta.env.VITE_API_URL || "https://notesapp-si-backend.onrender.com";
const API = RAW.replace(/\/+$/, "");
const API_BASE = API.endsWith("/api") ? API : `${API}/api`;

fetch(`${API_BASE}/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
})
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setCurrentUser(data))
      .catch(() => setCurrentUser(null));
  }, [token]);

  const handleLogin = (tok) => {
    localStorage.setItem("token", tok);
    setToken(tok);
    setRoute("dashboard");
  };

  const handleSignup = (tok) => {
    localStorage.setItem("token", tok);
    setToken(tok);
    setRoute("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null); 
    setRoute("home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <nav className="bg-gray-900 text-white shadow p-4 flex justify-between items-center">
        <h1
          className="text-xl font-semibold cursor-pointer flex items-center gap-2"
          onClick={() => setRoute("home")}
        >
          Notes App
          {currentUser && (
            <span className="text-sm text-gray-300">(@{currentUser.username})</span>
          )}
        </h1>

        <div className="space-x-4">
          <button
            onClick={() => setRoute("dashboard")}
            className="text-sm hover:text-indigo-400"
          >
            My Notes
          </button>
          <button
            onClick={() => setRoute("public")}
            className="text-sm hover:text-indigo-400"
          >
            Public
          </button>

          {loggedIn && (
            <button
              onClick={() => setRoute("workspaces")}
              className="text-sm hover:text-indigo-400"
            >
              Workspaces
            </button>
          )}

          {loggedIn ? (
            <button
              onClick={logout}
              className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={() => setRoute("login")}
                className="text-sm hover:text-indigo-400"
              >
                Login
              </button>
              <button
                onClick={() => setRoute("signup")}
                className="text-sm hover:text-indigo-400"
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1">
        {route === "home" && <Home onNavigate={setRoute} loggedIn={loggedIn} />}
        {route === "login" && (
          <Login onNavigate={setRoute} onLogin={handleLogin} />
        )}
        {route === "signup" && (
          <Signup onNavigate={setRoute} onSignup={handleSignup} />
        )}
        {route === "dashboard" && <Dashboard />}
        {route === "public" && <PublicNotes />}
        {route === "workspaces" && <Workspaces token={token} />}
      </div>
    </div>
  );
}

export default App;
