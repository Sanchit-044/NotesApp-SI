import express from "express";
import Workspace from "../models/Workspace.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

//creating notes
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    console.log("Create workspace request:", req.body, "User:", req.user);

    if (!name) {
      return res.status(400).json({ msg: "Name is required" });
    }

    const workspace = new Workspace({
      name,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });
    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error("Workspace create error:", err);
    res.status(500).json({ msg: err.message });
  }
});

//for inviting as a collaborator
router.post("/:id/invite", authMiddleware, async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

    // Only admin can invite
    if (!workspace.owner.equals(req.user.id)) {
      return res.status(403).json({ msg: "Only admin can invite collaborators" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (workspace.members.some(m => m.user.equals(user._id))) {
      return res.status(400).json({ msg: "Already a collaborator" });
    }

    workspace.members.push({ user: user._id, role: role || "editor" });
    await workspace.save();

    res.json({ msg: "Collaborator added", workspace });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user.id })
      .populate("members.user", "name email");
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;