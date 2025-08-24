import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import notesRoutes from "./routes/noteRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://notesapp-si-frontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/workspaces", workspaceRoutes);

app.get("/", (req, res) => res.send("✅ Notes App Backend is running..."));
app.get("/health", (req, res) => res.status(200).send("ok"));

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
