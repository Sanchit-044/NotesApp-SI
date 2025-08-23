import React, { useEffect, useState } from "react";

const RAW = import.meta.env.VITE_API_URL || "https://notesapp-si-backend.onrender.com";
const API = RAW.replace(/\/+$/, "");
const API_BASE = API.endsWith("/api") ? API : `${API}/api`;

export default function Workspaces({ token }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedWs, setSelectedWs] = useState(null);

  const [wsNotes, setWsNotes] = useState([]);
  const [nTitle, setNTitle] = useState("");
  const [nContent, setNContent] = useState("");
  const [nPublic, setNPublic] = useState(false);

  const [msg, setMsg] = useState("");
  const [loadingWs, setLoadingWs] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  async function parseJsonOrThrow(res) {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Unexpected response (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data?.msg || `Request failed (${res.status})`);
    return data;
  }

  async function createWorkspace(name) {
    const res = await fetch(`${API_BASE}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    return parseJsonOrThrow(res);
  }

  async function getWorkspaces() {
    const res = await fetch(`${API_BASE}/workspaces`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseJsonOrThrow(res);
  }

  async function inviteCollaborator(workspaceId, email, role = "editor") {
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, role }),
    });
    return parseJsonOrThrow(res);
  }

  async function getWorkspaceNotes(workspaceId) {
    const res = await fetch(`${API_BASE}/notes/workspace/${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseJsonOrThrow(res);
  }

  async function createWorkspaceNote(workspaceId, title, content, isPublic) {
    const res = await fetch(`${API_BASE}/notes/workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content, isPublic, workspaceId }),
    });
    return parseJsonOrThrow(res);
  }

  async function updateNote(noteId, patch) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    return parseJsonOrThrow(res);
  }

  async function deleteNote(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseJsonOrThrow(res);
  }

  useEffect(() => {
    if (!token) return;
    setLoadingWs(true);
    getWorkspaces()
      .then((list) => {
        setWorkspaces(list || []);
        if (selectedWs) {
          const keep = list.find((w) => w._id === selectedWs._id);
          setSelectedWs(keep || null);
        }
      })
      .catch((err) => setMsg("Failed to load workspaces: " + err.message))
      .finally(() => setLoadingWs(false));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedWs?._id) {
      setWsNotes([]);
      return;
    }
    setLoadingNotes(true);
    getWorkspaceNotes(selectedWs._id)
      .then(setWsNotes)
      .catch((err) => setMsg("Failed to load notes: " + err.message))
      .finally(() => setLoadingNotes(false));
  }, [token, selectedWs?._id]);

  const handleCreateWorkspace = async () => {
    try {
      setMsg("");
      if (!newName.trim()) return setMsg("Please enter a workspace name");
      const ws = await createWorkspace(newName.trim());
      setWorkspaces((prev) => [...prev, ws]);
      setNewName("");
      setMsg("Workspace created!");
    } catch (err) {
      setMsg("Failed to create workspace: " + (err.message || "Unknown error"));
    }
  };

  const handleInvite = async () => {
    try {
      setMsg("");
      if (!selectedWs) return setMsg("Select a workspace first");
      if (!inviteEmail.trim()) return setMsg("Enter an email");
      await inviteCollaborator(selectedWs._id, inviteEmail.trim());
      setInviteEmail("");
      const updated = await getWorkspaces();
      setWorkspaces(updated);
      setSelectedWs(updated.find((ws) => ws._id === selectedWs._id) || null);
      setMsg("Collaborator invited!");
    } catch (err) {
      setMsg("Failed to invite collaborator: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateNote = async () => {
    try {
      setMsg("");
      if (!selectedWs) return setMsg("Select a workspace first");
      if (!nTitle.trim() || !nContent.trim()) return setMsg("Title and content required");
      await createWorkspaceNote(selectedWs._id, nTitle.trim(), nContent.trim(), nPublic);
      setNTitle("");
      setNContent("");
      setNPublic(false);
      setWsNotes(await getWorkspaceNotes(selectedWs._id));
      setMsg("Note created!");
    } catch (err) {
      setMsg("Failed to create note: " + (err.message || "Unknown error"));
    }
  };

  const handleEditNote = async (note) => {
    const t = prompt("Title", note.title);
    if (t === null) return;
    const c = prompt("Content", note.content);
    if (c === null) return;
    const p = confirm("Make public?");
    try {
      setMsg("");
      await updateNote(note._id, { title: t, content: c, isPublic: p });
      setWsNotes(await getWorkspaceNotes(selectedWs._id));
      setMsg("Note updated!");
    } catch (err) {
      setMsg("Failed to update note: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm("Delete this note?")) return;
    try {
      setMsg("");
      await deleteNote(id);
      setWsNotes(await getWorkspaceNotes(selectedWs._id));
      setMsg("Note deleted!");
    } catch (err) {
      setMsg("Failed to delete note: " + (err.message || "Unknown error"));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg">
          <p className="text-gray-800">Please log in to manage workspaces.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-2 py-10">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-6 text-center">
          Workspaces
        </h2>

        {msg && (
          <p className="text-center text-yellow-300 font-medium mb-4">{msg}</p>
        )}

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg mb-8">
          <h3 className="font-semibold text-lg text-gray-800 mb-3">Create Workspace</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
            />
            <button
              type="button"
              onClick={handleCreateWorkspace}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Workspaces list */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">My Workspaces</h3>
            {loadingWs ? (
              <p className="text-gray-600">Loading…</p>
            ) : workspaces.length === 0 ? (
              <p className="text-gray-600">No workspaces yet.</p>
            ) : (
              <ul className="space-y-2">
                {workspaces.map((ws) => (
                  <li
                    key={ws._id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedWs?._id === ws._id ? "bg-gray-100 border-indigo-300" : "bg-white"
                    }`}
                    onClick={() => setSelectedWs(ws)}
                  >
                    {ws.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Workspace details */}
          <div className="lg:col-span-2">
            {!selectedWs ? (
              <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
                <p className="text-gray-700">Select a workspace to manage members and notes.</p>
              </div>
            ) : (
              <>
                {/* Members & Invite */}
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg mb-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Members of {selectedWs.name}
                  </h3>
                  <ul className="mb-4 space-y-2">
                    {(selectedWs.members || []).map((m) => (
                      <li
                        key={m.user?._id || m.email}
                        className="p-3 border rounded-lg bg-white flex items-center justify-between"
                      >
                        <span className="text-gray-800">
                          {m.user?.username || m.user?.email || m.email}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {m.status === "pending" ? `pending (${m.role})` : m.role}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Collaborator email"
                    />
                    <button
                      type="button"
                      onClick={handleInvite}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      Invite
                    </button>
                  </div>
                </div>

                {/* Create Note in workspace */}
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg mb-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Create Note in {selectedWs.name}
                  </h3>
                  <input
                    className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Note title"
                    value={nTitle}
                    onChange={(e) => setNTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Note content"
                    value={nContent}
                    onChange={(e) => setNContent(e.target.value)}
                  />
                  <label className="inline-flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={nPublic}
                      onChange={(e) => setNPublic(e.target.checked)}
                    />
                    <span className="text-gray-700">Make public</span>
                  </label>
                  <div>
                    <button
                      type="button"
                      onClick={handleCreateNote}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                      Create Note
                    </button>
                  </div>
                </div>

                {/* Notes list */}
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
                  <h3 className="font-semibold text-lg text-gray-800 mb-3">
                    Notes in {selectedWs.name}
                  </h3>
                  {loadingNotes ? (
                    <p className="text-gray-600">Loading…</p>
                  ) : wsNotes.length === 0 ? (
                    <p className="text-gray-600">No notes yet in this workspace.</p>
                  ) : (
                    <div className="grid gap-4">
                      {wsNotes.map((n) => (
                        <div key={n._id} className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg relative">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg text-gray-800">{n.title}</h4>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                              {n.isPublic ? "Public 🔓" : "Private 🔒"}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-2 whitespace-pre-wrap">{n.content}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition"
                              onClick={() => handleEditNote(n)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition"
                              onClick={() => handleDeleteNote(n._id)}
                            >
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
