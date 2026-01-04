import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "https://chat-in-uanp.onrender.com"],
    credentials: true,
  },
  transports: ["websocket"],
});

const userSocketMap = {};
const onlineUsers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[String(userId)] = socket.id;
  }
  io.emit("onlineUsers", Object.keys(userSocketMap));
  socket.emit("onlineUsers", Object.keys(userSocketMap));

  socket.on("sendMessage", (messageData) => {
    io.emit("recieveMessage", messageData);
  });

  socket.on("disconnect", () => {
    // console.log("A user disconnected", socket.id);
    delete onlineUsers[userId];
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  socket.on("requestOnlineUsers", () => {
    socket.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

export { io, app, server };
