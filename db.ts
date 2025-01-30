import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

let dbInstance: Database | null = null;
const STALE_TIMEOUT = 600;

export const openDb = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: "./users.db",
      driver: sqlite3.Database,
    });
    console.log("Database connection established");
  }
  return dbInstance;
};
let db: any;
export async function initializeDb() {
  db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstname TEXT,
      lastname TEXT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      userId TEXT PRIMARY KEY,
      socketId TEXT,
      lastActive INTEGER
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS missedMessages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      senderId TEXT,
      recipientId TEXT,
      content TEXT,
      timestamp INTEGER,
      roomId TEXT,
      isSeen BOOLEAN
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS activeUsers (
      userId TEXT PRIMARY KEY,
      lastSeen TEXT,
      isActive BOOLEAN
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS publicKeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipientId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      publicKey TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userA TEXT,
      userB TEXT,
      roomId TEXT
    )
  `);
}

export const findRoom = async (userA: string, userB: string) => {
  const room = await db.get(
    `
    SELECT roomId FROM rooms
    WHERE (userA = ? AND userB = ?) OR (userA = ? AND userB = ?)
  `,
    [userA, userB, userB, userA]
  );

  return room ? room.roomId : null;
};

export const createRoom = async (
  userA: string,
  userB: string,
  roomId: string
) => {
  await db.run(
    `
    INSERT INTO rooms (userA, userB, roomId)
    VALUES (?, ?, ?)
  `,
    [userA, userB, roomId]
  );
};

export async function addConnection(userId: string, socketId: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  await db.run(
    `
    INSERT INTO connections (userId, socketId, lastActive) 
    VALUES (?, ?, ?) 
    ON CONFLICT(userId) 
    DO UPDATE SET socketId = ?, lastActive = ?
  `,
    [userId, socketId, timestamp, socketId, timestamp]
  );
}

export async function removeConnection(userId: string) {
  await db.run(`DELETE FROM connections WHERE userId = ?`, userId);
}

export async function findRecipientSocketId(recipientId: string) {
  const connection = await db.get(
    "SELECT socketId FROM connections WHERE userId LIKE ?",
    [`%${recipientId}`]
  );

  return connection?.socketId || null;
}

async function cleanupStaleConnections() {
  const threshold = Math.floor(Date.now() / 1000) - STALE_TIMEOUT;
  await db.run(`DELETE FROM connections WHERE lastActive < ?`, threshold);
  console.log("Stale connections removed.");
}
export async function addMissedMessage(userId: string, senderId: string) {
  await db.run(
    `
    INSERT INTO missedMessages (userId, senderId, isSeen) 
    VALUES (?, ?, ?) 
    ON CONFLICT(userId) 
    DO UPDATE SET senderId = ?, isSeen = ?
  `,
    [userId, senderId, true]
  );
}

export async function removeMissedMessage(userId: string, senderId: string) {
  await db.run(`DELETE FROM missedMessages WHERE userId = ? AND senderId=?`, [
    userId,
    senderId,
  ]);
}

export async function getAllMissedMessage(userId: string) {
  const messages = await db.get(
    "SELECT * FROM missedMessages WHERE recipientId = ?",
    [userId]
  );
  if (!messages) {
    return { success: false, message: "no missed messages found" };
  }
  return { success: true, message: "missed messages found", messages };
}
export async function updateActiveStatus(userId: string) {
  await db.run(
    `
    INSERT INTO activeUsers (userId, lastSeen, isActive) 
    VALUES (?, ?, ?) 
    ON CONFLICT(userId) 
    DO UPDATE SET lastSeen = ?, isActive = ?
  `,
    [userId, Date.now(), true, Date.now(), true]
  );
}

setInterval(cleanupStaleConnections, 5 * 60 * 1000);
