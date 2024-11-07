import { decryptWord, encryptWord } from './controllers/securityController';
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { getUserByUserName, login, registerUser } from "./controllers/userController";
import cors from "cors";
import { initializeDb } from "./db";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Handle connection and disconnection
io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("message", (data) => {
    // Process and broadcast message
    io.emit("message", { ...data, senderId: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.post("/register", registerUser);
app.post("/login", login);
app.get('/user/:username', getUserByUserName);
app.post("/decrypt", decryptWord);
initializeDb();
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
