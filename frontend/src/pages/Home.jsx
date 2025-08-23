import React from "react";

export default function Home({ onNavigate, loggedIn }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center text-white px-6">
      <h1 className="text-5xl font-bold mb-4">Welcome to NotesApp</h1>
      <p className="text-lg mb-8 text-center max-w-xl">
        Your personal space to create, manage, and share notes securely.
      </p>

      {loggedIn ? (
        <div className="flex gap-4">
          <button
            onClick={() => onNavigate("dashboard")}
            className="bg-indigo-500 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold"
          >
            Go to My Notes
          </button>
          <button
            onClick={() => onNavigate("public")}
            className="bg-pink-500 hover:bg-pink-700 px-6 py-3 rounded-lg font-semibold"
          >
            View Public Notes
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={() => onNavigate("login")}
            className="bg-indigo-500 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="bg-pink-500 hover:bg-pink-700 px-6 py-3 rounded-lg font-semibold"
          >
            Signup
          </button>
        </div>
      )}
    </div>
  );
}
