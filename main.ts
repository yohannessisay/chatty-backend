import { decryptWord } from "./controllers/securityController";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  getUserByUserName,
  getUsers,
  login,
  registerUser,
} from "./controllers/userController";
import cors from "cors";
import {
  addConnection,
  findRecipientSocketId,
  getAllMissedMessage,
  initializeDb,
  removeConnection,
  updateActiveStatus,
} from "./db";

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

io.on("connection", (socket) => {
  const userId: string = socket.handshake.query.userId as string;
  const allMissedMessages = getAllMissedMessage(userId);
  updateActiveStatus(userId);
  addConnection(userId, socket.id);
  socket.emit("missedMessages", allMissedMessages);

  socket.on("joinRoom", ({ loggedInUserId, recipientId }) => {
    const loggedInUserRoomId = loggedInUserId.slice(
      loggedInUserId.length - 12,
      loggedInUserId.length
    );
    const room = [loggedInUserRoomId, recipientId].join("_");
    socket.join(room);
    console.log(`User ${loggedInUserRoomId} joined room: ${room}`);
  });

  socket.on("message", async ({ data, recipientId }) => {
    const recipientSocketId = await findRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", {
        data,
        senderId: userId,
      });
    }
  });

  socket.on("disconnect", () => {
    removeConnection(userId);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.post("/register", registerUser);
app.post("/login", login);
app.get("/user/:username", getUserByUserName);
app.get("/users", getUsers);
app.post("/decrypt", decryptWord);
initializeDb();
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
