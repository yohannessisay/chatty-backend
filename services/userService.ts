import { openDb } from "../db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
type User = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
};
type UserWithStatus = {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  lastSeen: string;
  isActive: string;
};
export const addUserService = async (
  firstname: string,
  lastname: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  const db = await openDb();
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.run(
      "INSERT INTO users (id, firstname, lastname, username, password) VALUES (?, ?, ?, ?, ?)",
      [userId, firstname, lastname, username, hashedPassword]
    );
    return { success: true, message: "User registered successfully" };
  } catch (error) {
    console.error("Error adding user:", error);
    return { success: false, message: "Error registering user" };
  }
};

export const loginService = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string; accessToken?: string }> => {
  try {
    const db = await openDb();
    const jwtKey = process.env.JWT_SECRET_KEY ?? "";
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      email,
    ]);

    if (!user) {
      return { success: false, message: "User not found" };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid credentials" };
    }
    const payload = {
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      id: user.id,
    };

    const token = jwt.sign(payload, jwtKey, { expiresIn: "1h" });

    return {
      success: true,
      message: "Logged in successfully",
      accessToken: token,
    };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, message: "Error logging in" };
  }
};
export const getUserByUserNameService = async (
  username: string
): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    password: string;
  };
}> => {
  const db = await openDb();

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (user) {
      return { success: true, message: "User fetched successfully", user };
    } else {
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, message: "Error fetching user" };
  }
};

export const getUsersService = async (): Promise<{
  success: boolean;
  message: string;
  users?: UserWithStatus[];
}> => {
  const db = await openDb();

  try {
    const users = (await db.all(`
      SELECT 
        users.*, 
        activeUsers.lastSeen,
        activeUsers.isActive
      FROM 
        users 
      LEFT JOIN 
        activeUsers 
      ON 
        users.id = activeUsers.userId
    `)) as UserWithStatus[];

    if (users.length > 0) {
      return {
        success: true,
        message: "Users fetched successfully",
        users: users,
      };
    } else {
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, message: "Error fetching user" };
  }
};
