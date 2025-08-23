import React, { useEffect, useState } from "react";

const RAW = import.meta.env.VITE_API_URL || "https://notesapp-si-backend.onrender.com";
const API = RAW.replace(/\/+$/, "");
const API_BASE = API.endsWith("/api") ? API : `${API}/api`;

export default function PublicNotes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes/public`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Load failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg(err.message || "Failed to load public notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function createPublicNote() {
    if (!token) {
      setMsg("You need to log in before writing a public note.");
      return;
    }

    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, isPublic: true }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed (${res.status}): ${text}`);
      }

      setTitle("");
      setContent("");
      setMsg("Note created successfully!");
      await load();
    } catch (err) {
      setMsg(err.message || "Failed to create note.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-2 py-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-6 text-center">
          Public Notes
        </h2>

        {msg && (
          <p className="text-center text-yellow-300 font-medium mb-4">{msg}</p>
        )}

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg mb-8">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">
            Create Public Note
          </h3>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={createPublicNote}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Post Public Note
          </button>
        </div>

        {loading ? (
          <p className="text-center text-white text-lg">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-white text-lg">
            No public notes available.
          </p>
        ) : (
          <div className="grid gap-4">
            {notes.map((n) => (
              <div
                key={n._id}
                className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg relative"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {n.title}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    Public
                  </span>
                </div>

                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{n.content}</p>

                <p className="text-sm text-gray-500 mt-2">
                  By: {n.owner?.username || "Unknown"}
                </p>

                <p className="text-xs text-gray-500 absolute bottom-2 right-3">
                  Last updated: {new Date(n.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
