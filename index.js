import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import userroutes from "../backend/routes/user.routes.js";
import messageRoute from "../backend/routes/message.routes.js";

dotenv.config();

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: [
    "http://localhost:5174",
    "http://localhost:5175",
    "https://chat-in-frontend.vercel.app",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------- DB CONNECTION (CACHED) ---------- */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

/* ---------- ROUTES ---------- */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/users", userroutes);
app.use("/api/message", messageRoute);

/* ---------- EXPORT (NO LISTEN) ---------- */
export default app;
