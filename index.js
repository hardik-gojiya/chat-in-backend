import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { app, server } from "./utils/Soket.js";
import path from "path";

import status from "express-status-monitor";
app.use(status());

const _dirname = path.resolve();

dotenv.config();

const PORT = process.env.PORT;

const corsOptions = {
  origin: [
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5000",
    "https://chat-in-uanp.onrender.com",
    "https://chatapp-mern-ck4w.onrender.com/",
    "https://chat-in-frontend.vercel.app/",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let isConnected = false;
(async () => {
  try {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
})();

import userroutes from "./routes/user.routes.js";
import messageRoute from "./routes/message.routes.js";
app.use("/api/users", userroutes);
app.use("/api/message", messageRoute);

// deploy
app.get("*", (req, res) => {
  res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
});

// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;
