import {
  decryptWord,
  getPublicKeys,
  storePublicKey,
} from "./controllers/securityController";
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
import { saveMissedMessageService } from "./services/userService";
import { processDecryptedMessages } from "./services/security";

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

io.on("connection", async (socket) => {
  const userId: string = socket.handshake.query.userId as string;

  const allMissedMessages = await getAllMissedMessage(userId);
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
    io.to(room).emit("roomJoined", {
      senderId: loggedInUserId,
      recipientId,
      roomId: room,
    });

    // Check if the recipient is online and join them to the room
    const recipientSocketId = await findRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.sockets.sockets.get(recipientSocketId)?.join(room);
    }

    console.log(`User ${loggedInUserId} joined room: ${room}`);
  });

  socket.on("send-public-key", async ({ recipientId, publicKey }) => {
    console.log("PUBLIC KEY", publicKey);
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
        await saveMissedMessageService(recipientId, message, room);
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
app.get("/user/getPublicKeys/:recipientId", getPublicKeys);
app.delete("/messages/updateMessageStatus/:id", getPublicKeys);
app.post("/user/connect", storePublicKey);
app.get("/users", getUsers);
app.post("/decrypt", decryptWord);
app.post("/processMessage", processDecryptedMessages);
initializeDb();
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
