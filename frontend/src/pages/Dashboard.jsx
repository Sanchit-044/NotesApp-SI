import React, { useEffect, useState } from "react";

const RAW = import.meta.env.VITE_API_URL || "https://notesapp-si-backend.onrender.com";
const API = RAW.replace(/\/+$/, "");
const API_BASE = API.endsWith("/api") ? API : `${API}/api`;

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) load();
  }, [token]);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Load failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg(err.message || "Failed to load notes");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function createNote() {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, isPublic }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed (${res.status}): ${text}`);
      }

      setTitle("");
      setContent("");
      setIsPublic(false);
      await load();
    } catch (err) {
      setMsg(err.message || "Failed to create note");
    }
  }

  async function del(id) {
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed (${res.status}): ${text}`);
      }

      await load();
    } catch (err) {
      setMsg(err.message || "Failed to delete note");
    }
  }

  async function edit(n) {
    const t = prompt("Title", n.title);
    if (t === null) return;
    const c = prompt("Content", n.content);
    if (c === null) return;
    const p = confirm("Make public?");

    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/notes/${n._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: t, content: c, isPublic: p }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed (${res.status}): ${text}`);
      }

      await load();
    } catch (err) {
      setMsg(err.message || "Failed to update note");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <p className="text-gray-800">Please log in to view your notes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-6 text-center">My Notes</h2>

        {msg && (
          <div className="mb-4 bg-white/90 text-red-600 p-3 rounded-lg shadow">
            {msg}
          </div>
        )}

        {loading ? (
          <div className="text-white text-center mb-6">Loading…</div>
        ) : (
          <div className="grid gap-4">
            {notes.map((n) => (
              <div key={n._id} className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg relative">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-800">{n.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      n.isPublic ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {n.isPublic ? "Public 🔓" : "Private 🔒"}
                  </span>
                </div>

                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{n.content}</p>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => edit(n)} className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded transition">
                    Edit
                  </button>
                  <button onClick={() => del(n._id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition">
                    Delete
                  </button>
                </div>

                <p className="text-xs text-gray-500 absolute bottom-2 right-3">
                  Last updated: {new Date(n.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <h3 className="font-semibold text-xl text-gray-800 mb-4">Create Note</h3>
          <input
            className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-gray-700">Make public</span>
          </label>

          <button
            onClick={createNote}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition duration-300"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
