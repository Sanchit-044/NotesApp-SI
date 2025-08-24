import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import Workspace from "../models/Workspace.js";

import Note from "../models/Note.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

async function isMember(workspaceId, userId) {
  const ws = await Workspace.findById(workspaceId).select("members");
  if (!ws) return false;
  return ws.members.some((m) => m.user?.toString() === userId);
}

// Public notes
router.get("/public", async (req, res) => {
  try {
    const notes = await Note.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .populate("owner", "username email");
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Workspace notes
router.get("/workspace/:workspaceId", auth, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const notes = await Note.find({ workspace: workspaceId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// All notes owned by current user
router.get("/", auth, async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate("owner", "name email");
    if (!note) return res.status(404).json({ msg: "Not found" });

    if (note.isPublic) return res.json(note);

    const header = req.header("Authorization");
    if (!header) return res.status(403).json({ msg: "Not allowed" });

    const token = header.split(" ")[1] || header;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      if (decoded.user.id !== note.owner._id.toString()) {
        return res.status(403).json({ msg: "Not allowed" });
      }
      return res.json(note);
    } catch {
      return res.status(403).json({ msg: "Not allowed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//CREATE NOTES
// Personal note
router.post(
  "/",
  auth,
  [body("title").notEmpty(), body("content").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, content, isPublic } = req.body;
      const note = new Note({
        title,
        content,
        isPublic: !!isPublic,
        owner: req.user.id,
      });
      await note.save();
      res.json(note);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// Create a note inside a workspace
router.post(
  "/workspace",
  auth,
  [body("title").notEmpty(), body("content").notEmpty(), body("workspaceId").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, content, isPublic, workspaceId } = req.body;
      const note = new Note({
        title,
        content,
        isPublic: !!isPublic,
        owner: req.user.id,
        workspace: workspaceId,
      });
      await note.save();
      res.json(note);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// UPDATE note
router.put("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: "Not found" });

    if (note.workspace) {
      const member = await isMember(note.workspace, req.user.id);
      if (!member) return res.status(403).json({ msg: "Not allowed" });
    } else {
      if (note.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: "Not allowed" });
      }
    }

    const { title, content, isPublic } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (isPublic !== undefined) note.isPublic = !!isPublic;

    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// DELETE note
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: "Not found" });

    if (note.workspace) {
      const member = await isMember(note.workspace, req.user.id);
      if (!member) return res.status(403).json({ msg: "Not allowed" });
    } else {
      if (note.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: "Not allowed" });
      }
    }

    await note.deleteOne();
    res.json({ msg: "Removed" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


export default router;
