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
  createRoom,
  findRecipientSocketId,
  findRoom,
  getAllMissedMessage,
  initializeDb,
  removeConnection,
  updateActiveStatus,
} from "./db";
import { saveMissedMessage } from "./services/userService";

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

  socket.on("joinRoom", async ({ loggedInUserId, recipientId }) => {
    let room = await findRoom(loggedInUserId, recipientId);
  
    if (!room) {
      room = [loggedInUserId, recipientId].sort().join("_");
      await createRoom(loggedInUserId, recipientId, room);
    }
  
    socket.join(room);
    io.to(room).emit("roomJoined", { senderId: loggedInUserId, recipientId, roomId: room });
  
    // Check if the recipient is online and join them to the room
    const recipientSocketId = await findRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.sockets.sockets.get(recipientSocketId)?.join(room);
    }
  
    console.log(`User ${loggedInUserId} joined room: ${room}`);
  });

  socket.on("message", async ({ data, recipientId }) => {
    const room = [userId, recipientId].sort().join("_");

    const message = {
      senderId: userId,
      recipientId,
      content: data,
      timestamp: new Date().toISOString(),
    };

    try {
      const recipientSocketId = await findRecipientSocketId(recipientId);

      if (recipientSocketId) {
        io.to(room).emit("receiveMessage", message);
      } else {
        await saveMissedMessage(recipientId, message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
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