// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const header = req.header("Authorization");
  if (!header) return res.status(401).json({ msg: "No token, authorization denied" });

  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];

  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded.user; // expects payload: { user: { id } }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

export default authMiddleware;
