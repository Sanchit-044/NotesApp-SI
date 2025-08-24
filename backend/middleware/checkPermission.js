import Workspace from "../models/Workspace.js";

export const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const workspace = await Workspace.findById(req.body.workspaceId || req.params.workspaceId);
      if (!workspace) return res.status(404).json({ msg: "Workspace not found" });

      const member = workspace.members.find(m => m.user.equals(req.user.id));
      if (!member) return res.status(403).json({ msg: "Not a collaborator" });

      if (requiredRole === "editor" && member.role === "viewer") {
        return res.status(403).json({ msg: "You don't have edit permission" });
      }
      if (requiredRole === "admin" && member.role !== "admin") {
        return res.status(403).json({ msg: "You must be an admin" });
      }

      req.workspace = workspace;
      next();
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  };

};
