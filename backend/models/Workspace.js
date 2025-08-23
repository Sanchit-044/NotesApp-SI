import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["admin", "editor", "viewer"], default: "editor" }
});

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [memberSchema],
}, { timestamps: true });

export default mongoose.model("Workspace", workspaceSchema);